from pydantic import BaseModel
from typing import List, Dict, Any


class ChatRequest(BaseModel):
    question: str


class customerQuestion(BaseModel):
    lastMessage: str


class QueryData(BaseModel):
    name: str
    email: str
    date: str
    bookingId: str
    description: str
    phoneNumber: str


from datetime import datetime


class Conversation(BaseModel):
    id: int
    guest: str
    subject: str
    lastMessage: str
    timestamp: datetime
