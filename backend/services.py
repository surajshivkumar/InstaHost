import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.schema import Document
from .utils import flatten_metadata
from langchain_community.document_loaders import (
    JSONLoader,
)  # Ensure this import is available


# Load and process documents from a given directory
def load_processed_files(directory: str):
    """
    Loads JSON files from a directory and processes them into document chunks.
    Each document is expected to contain 'content' and 'metadata' fields.
    """
    documents = []
    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            file_path = os.path.join(directory, filename)
            jq_schema = ".chunks[] | {content: .content, metadata: .metadata}"
            loader = JSONLoader(
                file_path=file_path,
                jq_schema=jq_schema,
                content_key="content",
                metadata_func=lambda metadata, _: {**metadata, "source": file_path},
            )
            documents.extend(loader.load())
    return documents


# Split text into manageable chunks
text_splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=50)


# Process loaded documents into chunks with metadata
from langchain.schema import Document
from .utils import flatten_metadata


def process_vcon_documents(loaded_documents):
    """
    Processes VCon JSON files and extracts meaningful content and metadata.
    It specifically looks for fields like 'dialog' and 'transcript' to extract the main content.
    """
    documents_as_objects = []

    for doc in loaded_documents:
        # Extract content from 'transcript' or 'dialog' fields based on your VCon structure
        content = ""
        if "analysis" in doc.metadata and "body" in doc.metadata["analysis"][0]:
            # Assuming the transcript is in the 'body' key of 'analysis'
            content = "\n".join(
                [entry["message"] for entry in doc.metadata["analysis"][0]["body"]]
            )
        elif "dialog" in doc.metadata:
            # Extract content from 'dialog' (if relevant)
            content = "\n".join(
                [dialogue["message"] for dialogue in doc.metadata["dialog"]]
            )

        # Flatten metadata to include useful details like the source, speaker, etc.
        metadata = flatten_metadata(doc.metadata)

        # Create Document objects with extracted content and metadata
        documents_as_objects.append(Document(page_content=content, metadata=metadata))

    return documents_as_objects


# Create vectorstore and retriever from processed documents
def create_vectorstore(documents):
    """
    Initializes the Chroma vector store using the processed document chunks and embeddings from OpenAI.
    """
    # Flatten metadata and prepare Document objects
    documents_as_objects = [
        Document(
            page_content=doc["page_content"], metadata=flatten_metadata(doc["metadata"])
        )
        for doc in documents
    ]

    # Create vectorstore using OpenAIEmbeddings and return the retriever
    vectorstore = Chroma.from_documents(
        documents=documents_as_objects, embedding=OpenAIEmbeddings()
    )
    return vectorstore.as_retriever()


# Perform search and return the top 5 relevant documents
def search_documents(question: str, directory: str):
    """
    Searches the top 5 most relevant document chunks based on the user's question.
    """
    # Load, process, and chunk documents
    loaded_documents = load_processed_files(directory)
    split_documents = process_vcon_documents(loaded_documents)

    # Create a vectorstore from the processed documents
    retriever = create_vectorstore(split_documents)

    # Retrieve top 5 relevant documents
    relevant_docs = retriever.get_relevant_documents(question, n_results=5)

    # Return relevant documents as a list of dicts containing content and metadata
    return [
        {"content": doc.page_content, "metadata": doc.metadata} for doc in relevant_docs
    ]
