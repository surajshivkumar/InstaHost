from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str


class customerQuestion(BaseModel):
    lastMessage: str
