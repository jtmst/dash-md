from typing import Literal

from pydantic import BaseModel


class PatientSummary(BaseModel):
    summary: str
    mode: Literal["llm", "template"]
