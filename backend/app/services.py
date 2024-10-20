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
import uuid
from datetime import datetime

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
        if filename.endswith(".json"):
            file_path = os.path.join(folder_path, filename)
            # Open and load the JSON file
            with open(file_path, "r") as file:
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
        "Other": [],
    }

    variations = set()
    for word in word_set:
        variations.add(word)
        variations.add(word + "s")
        variations.add(word + "ed")
        variations.add(word + "ing")
    return variations


category_keywords = {
    "Service Quality": {
        "service",
        "staff",
        "rude",
        "helpful",
        "attentive",
        "friendly",
        "unfriendly",
        "hospitality",
    },
    "Cleanliness": {"clean", "dirty", "dust", "stain", "hygiene", "smell", "odor"},
    "Food - Amenities": {
        "amenity",
        "facility",
        "wifi",
        "internet",
        "shower",
        "bed",
        "food",
        "breakfast",
        "meal",
    },
    "Noise and Privacy": {"noise", "quiet", "privacy", "disturb", "loud"},
    "Check-in and Check-out": {"check", "reception", "lobby", "wait", "key", "process"},
    "Price": {"price", "expensive", "cheap", "value", "cost", "charge", "fee", "rate"},
}


def categorize_complaints(problem_list):

    category_keywords = {
        "Service Quality": {
            "service",
            "staff",
            "rude",
            "helpful",
            "attentive",
            "friendly",
            "unfriendly",
            "hospitality",
        },
        "Cleanliness": {"clean", "dirty", "dust", "stain", "hygiene", "smell", "odor"},
        "Food - Amenities": {
            "amenity",
            "facility",
            "wifi",
            "internet",
            "shower",
            "bed",
            "food",
            "breakfast",
            "meal",
        },
        "Noise and Privacy": {"noise", "quiet", "privacy", "disturb", "loud"},
        "Check-in and Check-out": {
            "check",
            "reception",
            "lobby",
            "wait",
            "key",
            "process",
        },
        "Price": {
            "price",
            "expensive",
            "cheap",
            "value",
            "cost",
            "charge",
            "fee",
            "rate",
        },
    }
    synonyms = {
        "service": [
            "assistance",
            "help",
            "support",
            "care",
            "attention",
            "hospitality",
        ],
        "dirty": [
            "filthy",
            "unclean",
            "messy",
            "grimy",
            "soiled",
            "unhygienic",
            "smelly",
            "odor",
        ],
        "noise": [
            "racket",
            "commotion",
            "disturbance",
            "clamor",
            "din",
            "loud",
            "noisy",
        ],
        "expensive": [
            "costly",
            "pricey",
            "overpriced",
            "exorbitant",
            "extravagant",
            "high",
        ],
        "staff": [
            "employee",
            "worker",
            "personnel",
            "attendant",
            "assistant",
            "receptionist",
        ],
        "bed": ["mattress", "cot", "bunk", "berth", "sleeper", "pillow", "blanket"],
        "shower": ["bath", "washroom", "bathroom", "lavatory", "tub", "toilet", "sink"],
        "internet": ["wifi", "wi-fi", "connection", "network", "broadband", "online"],
        "clean": ["spotless", "immaculate", "pristine", "sanitary", "tidy", "hygienic"],
        "rude": [
            "impolite",
            "discourteous",
            "disrespectful",
            "uncivil",
            "ill-mannered",
            "unfriendly",
        ],
        "helpful": [
            "supportive",
            "accommodating",
            "cooperative",
            "obliging",
            "considerate",
            "friendly",
        ],
        "quiet": ["silent", "peaceful", "tranquil", "serene", "hushed", "calm"],
        "privacy": [
            "seclusion",
            "solitude",
            "isolation",
            "confidentiality",
            "discretion",
            "personal space",
        ],
        "check": ["verify", "inspect", "examine", "review", "assess", "process"],
        "wait": ["delay", "pause", "hold", "linger", "tarry", "queue"],
        "price": [
            "cost",
            "charge",
            "fee",
            "rate",
            "fare",
            "pricing",
            "expensive",
            "cheap",
        ],
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


def categorize_and_rename_in_directory(problems_list, directory, category_keywords):
    categorized_complaints = defaultdict(list)
    file_category_map = defaultdict(list)  # Track which files belong to which category

    # Get all files in the directory
    files = os.listdir(directory)

    if len(problems_list) != len(files):
        raise ValueError(
            "The number of problems does not match the number of files in the directory."
        )

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
            new_filename = (
                f"{category.lower().replace(' ', '_')}{rename_count[category]}.json"
            )

            # Construct full paths
            original_file_path = os.path.join(directory, original_file)
            new_file_path = os.path.join(directory, new_filename)

            try:
                if os.path.exists(original_file_path):
                    os.rename(original_file_path, new_file_path)
                    renamed_files[original_file] = new_filename
                else:
                    renamed_files[original_file] = (
                        "File not found"  # Handle missing files
                    )
            except:
                continue

    return categorized_complaints, renamed_files


def segmentCall(problem):
    try:

        # Initialize LLM with langchain_openai
        llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)

        # problem_list=gather_problems(directory_path)
        catKey = "\n".join(
            [f"- {key}: {value}" for key, value in category_keywords.items()]
        )
        print(problem)
        messages = [
            SystemMessage(
                content=(
                    "You are a helpful category assigner. Use these categories as your knowledge base: "
                    f"{catKey}. If the  problems  '{problem}' in the call records matches any category, provide "
                    "the corresponding information"
                    "please return a response in the follwoing way : ["
                    "]"
                )
            ),
            HumanMessage(content=problem),
        ]

        response = llm(messages)

        return response.content

    except Exception as e:
        return f"Error: {str(e)}"


# directory_path="Vcon"
# problems_list = gather_problems(directory_path)
# category_keywords = categorize_complaints()
# categorized_result, renamed_files = categorize_and_rename_in_directory(problems_list, directory_path, category_keywords)



# Function to generate the VCon JSON
def generate_vcon_json(customer_name, customer_email, customer_phone, problem_description):

    conversation_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()

    # Agent's static info
    agent_name = "Nathan Henderson"
    agent_email = "nathan.henderson@hotel.com"
    agent_phone = "+16125825148"
    
    # Construct the conversation with the dynamic problem description
    conversation = [
        {"speaker": "Agent", "message": f"Hello, thank you for contacting Hotel Express customer support. My name is {agent_name}. May I please have your name?"},
        {"speaker": "Customer", "message": f"Hello, my name is {customer_name}."},
        {"speaker": "Agent", "message": f"Thank you, {customer_name}. Can you please provide me with the first three digits of your phone number?"},
        {"speaker": "Customer", "message": f"Sure, it is {customer_phone[:3]}."},
        {"speaker": "Agent", "message": f"Great, thank you. Now, could you share with me the last two digits of your zip code?"},
        {"speaker": "Customer", "message": "Of course, they are 98."},
        {"speaker": "Agent", "message": f"Thank you for providing that information, {customer_name}. Now, please let me know how I can assist you today."},
        {"speaker": "Customer", "message": f"I’m calling because {problem_description}."},
        {"speaker": "Agent", "message": f"I’m sorry to hear that, {customer_name}. I will ensure that our team addresses the issue regarding {problem_description} as soon as possible."},
        {"speaker": "Customer", "message": "Thank you for your help."},
        {"speaker": "Agent", "message": "You're welcome. Thank you for reaching out to us. Have a wonderful day."},
        {"speaker": "Agent", "message": "End of conversation."}
    ]

    # JSON structure for the VCon file
    vcon_data = {
        "uuid": conversation_id,
        "created_at": timestamp,
        "updated_at": timestamp,
        "dialog": [
            {
                "alg": "SHA-512",
                "url": f"https://fake-vcons.s3.amazonaws.com/{conversation_id}.mp3",
                "meta": { "direction": "in", "disposition": "ANSWERED" },
                "type": "recording",
                "start": timestamp,
                "parties": [1, 0],
                "duration": 36.456,
                "filename": f"{conversation_id}.mp3",
                "mimetype": "audio/mp3",
                "signature": "fake-signature"
            }
        ],
        "parties": [
            {
                "tel": agent_phone,
                "meta": { "role": "agent" },
                "name": agent_name,
                "mailto": agent_email
            },
            {
                "tel": customer_phone,
                "meta": { "role": "customer" },
                "name": customer_name,
                "email": customer_email
            }
        ],
        "attachments": [
            {
                "type": "generation_info",
                "encoding": "none",
                "body": {
                    "agent_name": agent_name,
                    "customer_name": customer_name,
                    "business": "Hotel",
                    "problem": problem_description,
                    "prompt": "\nGenerate a fake conversation between a customer and an agent.\nThe agent should introduce themselves, their company and give the customer their name. The agent should ask for the customer's name.\nAs part of the conversation, have the agent ask for two pieces of personal information.  Spell out numbers. For example, 1000 should be said as one zero zero zero, not one thousand. The conversation should be at least 10 lines long and be complete. At the end of the conversation, the agent should thank the customer for their time and end the conversation.",
                    "created_on": timestamp,
                    "model": "gpt-3.5-turbo"
                }
            }
        ],
        "analysis": [
            {
                "type": "transcript",
                "dialog": 0,
                "vendor": "openai",
                "encoding": "none",
                "body": conversation,
                "vendor_schema": {
                    "model": "gpt-3.5-turbo",
                    "prompt": "Generate a fake conversation between a customer and an agent."
                }
            }
        ]
    }

    # Save the JSON to a file
    with open(f'{conversation_id}.json', 'w') as json_file:
        json.dump(vcon_data, json_file, indent=4)

    return vcon_data


vcon_json = generate_vcon_json(
    customer_name="Ruth Torres",
    customer_email="ruth.torres@gmail.com",
    customer_phone="+16793552302",
    problem_description="the room was very messy and the swimming pool was filthy"
)


