from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    status as http_status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.patient import (
    PATIENT_STATUSES,
    PaginatedResponse,
    PatientCreate,
    PatientResponse,
)
from app.services.patient_service import SORTABLE_COLUMNS
from app.services import patient_service

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.get("", response_model=PaginatedResponse)
async def list_patients(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    search: str | None = Query(default=None, max_length=200),
    patient_status: PATIENT_STATUSES | None = Query(default=None, alias="status"),
    sort_by: str = Query(default="last_name"),
    sort_order: str = Query(default="asc"),
    db: AsyncSession = Depends(get_db),
):
    if sort_by not in SORTABLE_COLUMNS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sort_by column. Allowed: {', '.join(sorted(SORTABLE_COLUMNS))}",
        )
    if sort_order not in ("asc", "desc"):
        raise HTTPException(
            status_code=400,
            detail="Invalid sort_order. Allowed: asc, desc",
        )

    patients, total = await patient_service.get_patients(
        db,
        limit=limit,
        offset=offset,
        search=search,
        status=patient_status,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return PaginatedResponse(
        items=patients,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    patient = await patient_service.get_patient(db, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post(
    "", response_model=PatientResponse, status_code=http_status.HTTP_201_CREATED
)
async def create_patient(
    data: PatientCreate,
    db: AsyncSession = Depends(get_db),
):
    return await patient_service.create_patient(db, data)


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: UUID,
    data: PatientCreate,
    db: AsyncSession = Depends(get_db),
):
    patient = await patient_service.update_patient(db, patient_id, data)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.delete("/{patient_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    deleted = await patient_service.delete_patient(db, patient_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Patient not found")
    return Response(status_code=http_status.HTTP_204_NO_CONTENT)
