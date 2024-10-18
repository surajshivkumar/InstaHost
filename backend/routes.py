from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from .services import search_documents
from .models import ChatRequest

router = APIRouter()


@router.post("/search")
async def search(request: ChatRequest):
    """Handles search interaction via POST request."""
    try:
        question = request.question
        directory = "../Conversations/vCon/"  # Get the directory from the request
        relevant_documents = search_documents(question, directory)
        return JSONResponse(content={"documents": relevant_documents})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
