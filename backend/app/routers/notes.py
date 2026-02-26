from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status as http_status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.note import NoteCreate, NoteResponse
from app.services import note_service

router = APIRouter(
    prefix="/api/patients/{patient_id}/notes",
    tags=["notes"],
)


@router.post("", response_model=NoteResponse, status_code=http_status.HTTP_201_CREATED)
async def create_note(
    patient_id: UUID,
    data: NoteCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await note_service.create_note(db, patient_id, data)
    except ValueError:
        raise HTTPException(status_code=404, detail="Patient not found")


@router.get("", response_model=list[NoteResponse])
async def list_notes(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await note_service.get_notes(db, patient_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Patient not found")


@router.delete("/{note_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_note(
    patient_id: UUID,
    note_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    deleted = await note_service.delete_note(db, note_id, patient_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Note not found")
    return Response(status_code=http_status.HTTP_204_NO_CONTENT)
