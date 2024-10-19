from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from .services import search_documents, search_documents_with_llm
from .models import ChatRequest, customerQuestion
import os

router = APIRouter()

# Set a default directory path
DEFAULT_DIRECTORY = "../Conversations/vCon/"


@router.post("/search")
async def search(request: ChatRequest):
    """Handles search interaction via POST request."""
    try:
        question = request.question
        directory = DEFAULT_DIRECTORY  # Use the default directory

        # Perform document search with LLM
        relevant_documents = search_documents(question, directory)

        # Convert the response to a dictionary
        response_content = {"documents": relevant_documents}

        return JSONResponse(content=response_content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/csrBot")
async def csrBot(request: customerQuestion):
    """Handles search interaction via POST request."""
    try:
        lastMessage = request.lastMessage
        print(lastMessage)
        # Convert the response to a dictionary
        response_content = {"documents": "Received"}

        return JSONResponse(content=response_content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
