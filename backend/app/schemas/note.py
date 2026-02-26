import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NoteCreate(BaseModel):
    content: str = Field(min_length=1, max_length=10000)
    timestamp: datetime


class NoteResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    content: str
    timestamp: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
