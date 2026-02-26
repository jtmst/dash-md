from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import Note
from app.models.patient import Patient
from app.schemas.note import NoteCreate


async def _get_patient_or_raise(db: AsyncSession, patient_id: UUID) -> Patient:
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalars().first()
    if patient is None:
        raise ValueError("Patient not found")
    return patient


async def create_note(db: AsyncSession, patient_id: UUID, data: NoteCreate) -> Note:
    await _get_patient_or_raise(db, patient_id)
    note = Note(patient_id=patient_id, **data.model_dump())
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return note


async def get_notes(db: AsyncSession, patient_id: UUID) -> list[Note]:
    await _get_patient_or_raise(db, patient_id)
    result = await db.execute(
        select(Note)
        .where(Note.patient_id == patient_id)
        .order_by(Note.timestamp.desc())
    )
    return list(result.scalars().all())


async def delete_note(db: AsyncSession, note_id: UUID, patient_id: UUID) -> bool:
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.patient_id == patient_id)
    )
    note = result.scalars().first()
    if note is None:
        return False
    await db.delete(note)
    await db.flush()
    return True
