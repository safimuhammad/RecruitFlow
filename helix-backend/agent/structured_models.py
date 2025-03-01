from pydantic import BaseModel, Field
from typing import Optional, List


class Output(BaseModel):
    answer: str = Field(description="The answer to the user's question")
    source: Optional[str] = Field(description="The source used to answer the question, should be a website.")

class Step(BaseModel):
    step_number: str = Field(description="The action to be performed in HTML format")
    content: str = Field(description="Description of the step in HTML format")
    phase: Optional[str] = Field(description="Phase of the step, in HTML format", default="Inital")

class WorkspaceInput(BaseModel):
    steps: List[Step] = Field(description="The list of steps to be processed by the agent in HTML format")

class WorkspaceOutput(BaseModel):
    steps: List[Step] = Field(description="The list of processed steps by the agent in HTML format")

class Message(BaseModel):
    message: str = Field(description="Content of the message")
    is_input: bool = Field(description="Whether the message is from the user (True) or the system (False)")
    timestamp: str = Field(description="Timestamp of when the message was sent")

class Conversation(BaseModel):
    messages: List[Message] = Field(description="List of messages in a conversation")

class ChatHistory(BaseModel):
    conversations: dict[str, List[Message]] = Field(
        description="Dictionary mapping conversation IDs to lists of messages"
    )
    
    @classmethod
    def validate_conversations(cls, v):
        if v == "all":
            return {}  # Return empty dict when "all" is passed
        return v


