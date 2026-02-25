from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Patient
from app.schemas.patient import PatientCreate

SORTABLE_COLUMNS = {
    "first_name",
    "last_name",
    "date_of_birth",
    "status",
    "last_visit_date",
    "created_at",
}


async def get_patients(
    db: AsyncSession,
    limit: int = 20,
    offset: int = 0,
    search: str | None = None,
    status: str | None = None,
    sort_by: str = "last_name",
    sort_order: str = "asc",
) -> tuple[list[Patient], int]:
    limit = min(limit, 100)

    query = select(Patient)
    count_query = select(func.count()).select_from(Patient)

    if search:
        safe = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        pattern = f"%{safe}%"
        search_filter = (
            Patient.first_name.ilike(pattern)
            | Patient.last_name.ilike(pattern)
            | Patient.email.ilike(pattern)
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if status:
        query = query.where(Patient.status == status)
        count_query = count_query.where(Patient.status == status)

    if sort_by not in SORTABLE_COLUMNS:
        raise ValueError(f"Invalid sort column: {sort_by}")
    column = getattr(Patient, sort_by)
    if sort_order == "desc":
        column = column.desc()
    query = query.order_by(column)

    query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    patients = list(result.scalars().all())

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    return patients, total


async def get_patient(db: AsyncSession, patient_id: UUID) -> Patient | None:
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    return result.scalars().first()


async def create_patient(db: AsyncSession, data: PatientCreate) -> Patient:
    patient = Patient(**data.model_dump())
    db.add(patient)
    await db.flush()
    await db.refresh(patient)
    return patient


async def update_patient(
    db: AsyncSession, patient_id: UUID, data: PatientCreate
) -> Patient | None:
    patient = await get_patient(db, patient_id)
    if patient is None:
        return None

    for field, value in data.model_dump().items():
        setattr(patient, field, value)

    await db.flush()
    await db.refresh(patient)
    return patient


async def delete_patient(db: AsyncSession, patient_id: UUID) -> bool:
    patient = await get_patient(db, patient_id)
    if patient is None:
        return False

    await db.delete(patient)
    await db.flush()
    return True
