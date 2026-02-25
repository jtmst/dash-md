import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

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
    allergies: list[str] = []
    conditions: list[str] = []
    status: PATIENT_STATUSES = "active"
    last_visit_date: datetime | None = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    date_of_birth: date | None = None
    gender: str | None = Field(None, min_length=1, max_length=20)
    email: EmailStr | None = None
    phone: str | None = Field(None, min_length=1, max_length=20)
    address: str | None = Field(None, min_length=1, max_length=500)
    blood_type: BLOOD_TYPES | None = None
    allergies: list[str] | None = None
    conditions: list[str] | None = None
    status: PATIENT_STATUSES | None = None
    last_visit_date: datetime | None = None


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
