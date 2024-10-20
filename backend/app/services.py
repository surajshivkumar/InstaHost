import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI

from langchain.schema import Document
from typing import List, Dict, Any
import json
from dotenv import load_dotenv

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


from langchain.schema import HumanMessage, SystemMessage


def generate_responses(question: str):
    # client = OpenAI(
    # api_key = openai_api_key
    # )
    # MODEL = "gpt-3.5-turbo"

    llm = ChatOpenAI(model_name="gpt-3.5-turbo")
    rules = {
        "no smoking": "Smoking is strictly prohibited in all areas of the room and building.",
        "cancellation policy": "No cancellations or modifications are allowed within 48 hours of your booking. Cancellations outside of this period may incur a fee.",
        "check-in time": "Check-in starts at 3:00 PM, and check-out is by 11:00 AM. Early check-ins and late check-outs may be arranged upon request.",
        "pet policy": "Pets are welcome with a surcharge of $50 per stay. However, restrictions apply based on the type and size of pets.",
    }

    try:
        messages = [
            SystemMessage(
                content=(
                    "If the user's question '{}' resembles any of the pre-defined rules '{}', "
                    "return the corresponding rule value. Otherwise, act as a helpful assistant who knows all the hotel policies."
                ).format(question, rules)
            ),
            HumanMessage(content=question),
        ]

        # Generate the response
        response = llm(messages)
        return response
    except Exception as e:
        return f"Error: {str(e)}"
