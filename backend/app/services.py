import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI

from langchain.schema import Document
from typing import List, Dict, Any
import json
from dotenv import load_dotenv
from typing import Dict, Optional
import httpx
import re
from collections import defaultdict
from difflib import get_close_matches

from langchain.schema import SystemMessage, HumanMessage

# Load environment variables from .env file
load_dotenv()

# Now you can access the OpenAI API key
openai_api_key = os.getenv("OPENAI_API_KEY")

# Set the API key in the environment (if required by the library)
os.environ["OPENAI_API_KEY"] = openai_api_key


def load_processed_files(directory: str) -> List[Document]:
    if not os.path.exists(directory):
        raise ValueError(f"Directory does not exist: {directory}")

    documents = []
    files = [f for f in os.listdir(directory) if f.endswith(".vcon.json")]

    print(f"Found {len(files)} VCon JSON files in directory")

    for filename in files:
        file_path = os.path.join(directory, filename)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                vcon_data = json.load(f)

            processed_docs = process_vcon_data(vcon_data, file_path)
            if processed_docs:
                documents.extend(processed_docs)
                # print(f"Successfully processed {filename}")
            else:
                print(f"No valid content found in {filename}")

        except json.JSONDecodeError as e:
            print(f"Invalid JSON in file {filename}: {e}")
        except Exception as e:
            print(f"Error processing file {filename}: {e}")

    print(f"Successfully processed {len(documents)} documents")
    return documents


from langchain.schema import Document


def process_vcon_data(vcon_data: Dict[str, Any], file_path: str) -> List[Document]:
    """
    Processes a VCon JSON structure and extracts individual messages as separate documents.
    """
    documents = []

    # Extract base metadata (flatten structure)
    base_metadata = {
        "source": file_path,
        "uuid": vcon_data.get("uuid", ""),
        "created_at": vcon_data.get("created_at", ""),
        "updated_at": vcon_data.get("updated_at", ""),
    }

    # Process analysis sections for individual messages
    for analysis in vcon_data.get("analysis", []):
        if analysis.get("type") == "transcript":
            transcript_body = analysis.get("body", [])

            for entry in transcript_body:
                if isinstance(entry, dict):
                    speaker = entry.get("speaker", "")
                    message = entry.get("message", "")

                    if message:
                        # Attach metadata to each message
                        message_metadata = {
                            **base_metadata,
                            "speaker": speaker,
                            "speaker_role": (
                                "agent" if speaker == "Agent" else "customer"
                            ),
                            "analysis_type": "transcript",
                        }

                        # Add the message as a separate document
                        documents.append(
                            Document(page_content=message, metadata=message_metadata)
                        )

    return documents


def create_vectorstore(documents: List[Document]):
    """
    Creates a Chroma vectorstore from the processed message-level documents.

    Args:
        documents: List of processed Document objects (where each document represents one message).

    Returns:
        Chroma retriever object
    """
    if not documents:
        raise ValueError("No valid documents to create embeddings for.")

    try:
        # Create vectorstore using each message as a document
        vectorstore = Chroma.from_documents(
            documents=documents, embedding=OpenAIEmbeddings()
        )
        return vectorstore.as_retriever()
    except Exception as e:
        print(f"Error creating vectorstore: {e}")
        raise


def search_documents(question: str, directory: str) -> List[Dict[str, Any]]:
    """
    Searches for relevant messages and returns metadata and the first line of the message.
    """
    # Load and process documents (messages)
    processed_docs = load_processed_files(directory)

    if not processed_docs:
        print("No valid documents found to search through")
        return []

    # Create vectorstore and retrieve relevant messages
    try:
        retriever = create_vectorstore(processed_docs)
        relevant_docs = retriever.get_relevant_documents(question, n_results=5)
        uuids = [
            f"../Conversations/vCon/{doc.metadata['uuid']}.vcon.json"
            for doc in relevant_docs
        ]
        return uuids

        # Return simplified format with just UUID, speaker, and content
        # return [
        #     {
        #         "uuid": doc.metadata["uuid"],
        #         "speaker": doc.metadata["speaker"],
        #         "content": doc.page_content,  # Get full message content
        #     }
        #     for doc in relevant_docs
        # ]
    except Exception as e:
        print(f"Error during search: {e}")
        raise


def search_documents_with_llm(question: str, directory: str):
    processed_docs = load_processed_files(directory)
    retriever = create_vectorstore(processed_docs)

    llm = ChatOpenAI(model_name="gpt-3.5-turbo")

    relevant_docs = retriever.get_relevant_documents(question, n_results=5)

    combined_docs = "\n\n".join([doc.page_content for doc in relevant_docs])
    refined_question = f"Here are the most relevant sections from the documents. Please answer the question: {question}\n\n{combined_docs}"

    response = llm.generate(refined_question)

    return response


async def get_policies_from_nextjs() -> Dict[str, str]:
    """Fetch all policies from Next.js API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:3001/api/policies")

            if response.status_code != 200:
                print(f"API error: Status {response.status_code}")
                return {}

            policies = response.json()

            # Convert to dictionary format {title: content}
            policy_dict = {
                policy["title"].lower(): policy["content"] for policy in policies
            }

            return policy_dict
    except Exception as e:
        print(f"API error: {str(e)}")
        return {}


async def generate_responses(question: str) -> Optional[str]:
    try:
        # Initialize LLM with langchain_openai
        llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)

        # Fetch policies from Next.js API asynchronously
        rules = await get_policies_from_nextjs()

        if not rules:
            return "Error: Unable to fetch policies from API"
        rules_str = "\n".join([f"- {key}: {value}" for key, value in rules.items()])

        messages = [
            SystemMessage(
                content=(
                    "You are a helpful hotel assistant. Use these policies as your knowledge base: "
                    f"{rules_str}. If the user's question '{question}' matches any policy, provide "
                    "the corresponding information. If no exact match is found, use the policies "
                    "as context to provide a helpful response. Always maintain a professional "
                    "and courteous tone."
                )
            ),
            HumanMessage(content=question),
        ]

        # Generate response
        response = await llm.ainvoke(messages)

        return response.content

    except Exception as e:
        return f"Error: {str(e)}"


# Synchronous version if needed
import asyncio


def generate_responses_sync(question: str) -> Optional[str]:
    """Synchronous wrapper for generate_responses"""
    return asyncio.run(generate_responses(question))





def gather_problems(folder_path):
    
    problems_list = []
    # Iterate through each file in the folder
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):  
            file_path = os.path.join(folder_path, filename)
            # Open and load the JSON file
            with open(file_path, 'r') as file:
                data = json.load(file)
                # Check if the "attachments" field exists and contains the problem
                if "attachments" in data and len(data["attachments"]) > 0:
                    problem = data["attachments"][0]["body"]["problem"]
                    problems_list.append(problem)
    return problems_list




def add_variations(word_set):
    
    categories = {
    "Service Quality": [],
    "Cleanliness": [],
    "Food and Amenities": [],
    "Noise and Privacy": [],
    "Check-in and Check-out": [],
    "Price": [],
    "Other": []
    }
   
    variations = set()
    for word in word_set:
        variations.add(word)
        variations.add(word + "s")  
        variations.add(word + "ed") 
        variations.add(word + "ing")  
    return variations




def categorize_complaints(problem_list):
    
    category_keywords = {
    "Service Quality": {"service", "staff", "rude", "helpful", "attentive", "friendly", "unfriendly", "hospitality"},
    "Cleanliness": {"clean", "dirty", "dust", "stain", "hygiene", "smell", "odor"},
    "Food - Amenities": {"amenity", "facility", "wifi", "internet", "shower", "bed", "food", "breakfast", "meal"},
    "Noise and Privacy": {"noise", "quiet", "privacy", "disturb", "loud"},
    "Check-in and Check-out": {"check", "reception", "lobby", "wait", "key", "process"},
    "Price": {"price", "expensive", "cheap", "value", "cost", "charge", "fee", "rate"},
}
    synonyms = {
        "service": ["assistance", "help", "support", "care", "attention", "hospitality"],
        "dirty": ["filthy", "unclean", "messy", "grimy", "soiled", "unhygienic", "smelly", "odor"],
        "noise": ["racket", "commotion", "disturbance", "clamor", "din", "loud", "noisy"],
        "expensive": ["costly", "pricey", "overpriced", "exorbitant", "extravagant", "high"],
        "staff": ["employee", "worker", "personnel", "attendant", "assistant", "receptionist"],
        "bed": ["mattress", "cot", "bunk", "berth", "sleeper", "pillow", "blanket"],
        "shower": ["bath", "washroom", "bathroom", "lavatory", "tub", "toilet", "sink"],
        "internet": ["wifi", "wi-fi", "connection", "network", "broadband", "online"],
        "clean": ["spotless", "immaculate", "pristine", "sanitary", "tidy", "hygienic"],
        "rude": ["impolite", "discourteous", "disrespectful", "uncivil", "ill-mannered", "unfriendly"],
        "helpful": ["supportive", "accommodating", "cooperative", "obliging", "considerate", "friendly"],
        "quiet": ["silent", "peaceful", "tranquil", "serene", "hushed", "calm"],
        "privacy": ["seclusion", "solitude", "isolation", "confidentiality", "discretion", "personal space"],
        "check": ["verify", "inspect", "examine", "review", "assess", "process"],
        "wait": ["delay", "pause", "hold", "linger", "tarry", "queue"],
        "price": ["cost", "charge", "fee", "rate", "fare", "pricing", "expensive", "cheap"],
        "food": ["meal", "breakfast", "lunch", "dinner", "cuisine", "dish", "menu"],
        "smell": ["odor", "scent", "aroma", "stench", "fragrance"],
        "quality": ["standard", "grade", "caliber", "condition", "value"],
    }

    for category, keywords in category_keywords.items():
        expanded_keywords = set()
        for word in keywords:
            expanded_keywords.update(add_variations({word}))
            if word in synonyms:
                expanded_keywords.update(add_variations(set(synonyms[word])))
        category_keywords[category] = expanded_keywords
    return category_keywords


def categorize_and_rename_in_directory(problems_list, directory,category_keywords):
    categorized_complaints = defaultdict(list)
    file_category_map = defaultdict(list)  # Track which files belong to which category

    # Get all files in the directory
    files = os.listdir(directory)
    
    if len(problems_list) != len(files):
        raise ValueError("The number of problems does not match the number of files in the directory.")

    # Process each problem and corresponding file
    for problem, file in zip(problems_list, files):
        problem_cleaned = problem.lower().strip()

        matched = False
        for category, keywords in category_keywords.items():
            # Check if the cleaned problem contains any keyword
            if any(keyword in problem_cleaned for keyword in keywords):
                categorized_complaints[category].append(problem)
                file_category_map[category].append(file)
                matched = True
                break
        
        # If no match, classify under "Other"
        if not matched:
            categorized_complaints["Other"].append(problem)
            file_category_map["Other"].append(file)

    # Keep track of how many files we've renamed for each category
    rename_count = defaultdict(int)

    # Dictionary to store the renamed files
    renamed_files = {}

    # Renaming logic based on categorized complaints
    for category, files in file_category_map.items():
        unique_files = set(files)  # Avoid renaming the same file multiple times
        for original_file in unique_files:
            rename_count[category] += 1
            new_filename = f"{category.lower().replace(' ', '_')}{rename_count[category]}.json"
            
            # Construct full paths
            original_file_path = os.path.join(directory, original_file)
            new_file_path = os.path.join(directory, new_filename)
            
            try:
                if os.path.exists(original_file_path):
                    os.rename(original_file_path, new_file_path)
                    renamed_files[original_file] = new_filename
                else:
                    renamed_files[original_file] = "File not found"  # Handle missing files
            except:
                continue

    return categorized_complaints, renamed_files

def incoming_call_records(directory_path):
    try:
        # Initialize LLM with langchain_openai
        llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)

        problem_list=gather_problems(directory_path)

        messages = [
            SystemMessage(
                content=(
                    "You are a helpful category assigner. Use these categories as your knowledge base: "
                    f"{category_keywords}. If the  problems  '{problem_list}' in the call records matches any category, provide "
                    "the corresponding information"
                )
            ),
            HumanMessage(content=question),
        ]

        

    except Exception as e:
        return f"Error: {str(e)}"

directory_path="Vcon"
problems_list = gather_problems(directory_path)  
category_keywords = categorize_complaints()  
categorized_result, renamed_files = categorize_and_rename_in_directory(problems_list, directory_path, category_keywords)




