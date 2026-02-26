from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.note import Note
from app.schemas.summary import PatientSummary
from app.services import patient_service
from app.services.summary_service import generate_summary

router = APIRouter(prefix="/api/patients/{patient_id}", tags=["summary"])


@router.get("/summary", response_model=PatientSummary)
async def get_patient_summary(patient_id: UUID, db: AsyncSession = Depends(get_db)):
    patient = await patient_service.get_patient(db, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    notes_result = await db.execute(
        select(Note).where(Note.patient_id == patient_id)
    )
    notes = list(notes_result.scalars().all())

    return await generate_summary(patient, notes)
