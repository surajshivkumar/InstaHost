from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
import random
from .services import (
    search_documents,
    search_documents_with_llm,
    generate_responses,
    segmentCall,
    generate_vcon_json,
    processConversationBySegment,
)
from .models import ChatRequest, customerQuestion, QueryData, Conversation
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

        # Make sure to await the asynchronous function
        res = await generate_responses(lastMessage)
        # Convert the response to a dictionary
        response_content = {"documents": res}

        return JSONResponse(content=response_content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/segment")
async def segment(request: customerQuestion):
    """Handles search interaction via POST request."""
    try:
        lastMessage = request.lastMessage

        # Make sure to await the asynchronous function
        res = segmentCall(lastMessage)

        # Convert the response to a dictionary
        response_content = {"Segments": res}

        return JSONResponse(content=response_content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


import json


@router.post("/query")
async def process_query(query_data: QueryData):
    try:

        customer_name = query_data.name
        customer_email = query_data.email
        customer_phone = query_data.phoneNumber
        problem_description = query_data.description
        problem_segment = segmentCall(query_data.description)

        segmentedConversation = {
            "id": random.randint(
                1000, 9999
            ),  # Random 4-digit ID or use any unique identifier strategy
            "guest": customer_name,  # Name of the customer
            "subject": problem_segment.strip("[]"),  # Segment/category of the problem
            "lastMessage": problem_description,  # Description or the last message of the conversation
            "timestamp": datetime.now().isoformat(),  # Current timestamp in ISO format
        }
        print(segmentedConversation)
        filename = f"Conversation{segmentedConversation["id"]}"
        with open(
            f"../Conversations/ConversationBySegment/{filename}.json",
            "w",
        ) as json_file:
            json.dump(segmentedConversation, json_file, indent=4)

        #         {
        #   "id": 1,
        #   "guest": "John Doe",
        #   "subject": "Check-in and Check-out",
        #   "lastMessage": "Hi, I was wondering if it's possible to check in earlier than the listed time?",
        #   "timestamp": "2023-06-15T18:30:00Z"
        # }

        generate_vcon_json(
            customer_name,
            customer_email,
            customer_phone,
            problem_description,
            problem_segment,
        )

        # Simulate processing (e.g., logging or saving to database)
        print(f"Received query from {query_data.name}, processing...")

        # Example of some processing logic
        processed_result = {
            "message": f"Query received for order {query_data.bookingId} from {query_data.name}",
            "details": query_data.description,
        }

        # Return the processed result
        return {"status": "success", "data": processed_result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from typing import List


@router.get("/conversations", response_model=List[Conversation])
async def get_conversations():
    """
    API endpoint to retrieve all processed conversations.
    """
    try:
        directory_path = "../Conversations/ConversationBySegment/"  # Replace with your actual directory path
        conversations = processConversationBySegment(directory_path)
        return conversations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
