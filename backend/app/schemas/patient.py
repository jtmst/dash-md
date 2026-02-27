import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

BLOOD_TYPES = Literal["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
PATIENT_STATUSES = Literal["active", "inactive", "critical"]


class PatientBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    date_of_birth: date
    gender: str = Field(min_length=1, max_length=20)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=20)
    address: str = Field(min_length=1, max_length=500)
    blood_type: BLOOD_TYPES | None = None
    allergies: list[str] = Field(default=[], max_length=50)
    conditions: list[str] = Field(default=[], max_length=50)
    status: PATIENT_STATUSES = "active"
    last_visit_date: datetime | None = None

    @field_validator("allergies", "conditions", mode="before")
    @classmethod
    def validate_list_items(cls, v: list[str]) -> list[str]:
        if not isinstance(v, list):
            return v
        for item in v:
            if isinstance(item, str) and len(item) > 200:
                raise ValueError("Each item must be 200 characters or fewer")
        return v

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob_in_past(cls, v: date) -> date:
        if v >= date.today():
            raise ValueError("Date of birth must be in the past")
        return v


class PatientCreate(PatientBase):
    pass


class PatientResponse(PatientBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseModel):
    items: list[PatientResponse]
    total: int
    limit: int
    offset: int
