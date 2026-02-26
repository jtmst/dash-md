import logging
from datetime import date

from openai import AsyncOpenAI

from app.config import settings
from app.models.note import Note
from app.models.patient import Patient
from app.schemas.summary import PatientSummary

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1",
            timeout=30.0,
        )
    return _client


def _calculate_age(dob: date) -> int:
    today = date.today()
    age = today.year - dob.year
    if (today.month, today.day) < (dob.month, dob.day):
        age -= 1
    return age


def _format_date(dt) -> str:
    return dt.strftime("%B %d, %Y")


def generate_template_summary(patient: Patient, notes: list[Note]) -> str:
    age = _calculate_age(patient.date_of_birth)
    name = f"{patient.first_name} {patient.last_name}"

    intro = f"{name} is a {age}-year-old {patient.gender.lower()} patient"
    if patient.blood_type:
        intro += f" with blood type {patient.blood_type}"
    intro += f", currently listed as {patient.status}."

    if patient.conditions:
        conditions_str = ", ".join(patient.conditions)
        medical = f" The patient has the following conditions: {conditions_str}."
    else:
        medical = " The patient has no known conditions on file."

    if patient.allergies:
        allergies_str = ", ".join(patient.allergies)
        medical += f" Known allergies include {allergies_str}."
    else:
        medical += " No known allergies are documented."

    if patient.last_visit_date:
        visit = f" The most recent visit was on {_format_date(patient.last_visit_date)}."
    else:
        visit = " No visit date is recorded."

    # Most recent notes first, show last 2 truncated
    sorted_notes = sorted(notes, key=lambda n: n.timestamp, reverse=True)

    if sorted_notes:
        recent = sorted_notes[:2]
        note_lines = []
        for note in recent:
            note_date = _format_date(note.timestamp)
            content = note.content if len(note.content) <= 200 else note.content[:200] + "..."
            note_lines.append(f" On {note_date}: {content}")
        notes_section = "\n\nRecent notes:" + "".join(f"\n{line}" for line in note_lines)
        older_count = len(sorted_notes) - len(recent)
        if older_count > 0:
            notes_section += f"\n\n{older_count} additional earlier note{'s' if older_count > 1 else ''} on file."
    else:
        notes_section = "\n\nNo clinical notes on file."

    return intro + medical + visit + notes_section


def _build_patient_data(patient: Patient, notes: list[Note]) -> dict:
    """Build a safe data dict with only clinically relevant fields."""
    age = _calculate_age(patient.date_of_birth)
    sorted_notes = sorted(notes, key=lambda n: n.timestamp)
    recent_notes = sorted_notes[-5:]

    return {
        "name": f"{patient.first_name} {patient.last_name}",
        "age": age,
        "gender": patient.gender,
        "blood_type": patient.blood_type or "Unknown",
        "conditions": patient.conditions if patient.conditions else ["None"],
        "allergies": patient.allergies if patient.allergies else ["None"],
        "status": patient.status,
        "notes": [
            {
                "date": _format_date(n.timestamp),
                "content": n.content[:500] if len(n.content) > 500 else n.content,
            }
            for n in recent_notes
        ],
    }


async def generate_llm_summary(patient: Patient, notes: list[Note]) -> str:
    client = _get_client()

    patient_data = _build_patient_data(patient, notes)

    system_prompt = (
        "You are a clinical documentation assistant. Generate a concise, professional "
        "clinical summary for a patient based on the provided data. Write in a narrative "
        "style suitable for a medical chart summary. Do not include any internal system "
        "identifiers. Keep the summary to 2-3 paragraphs."
    )

    user_message = f"Patient data:\n{patient_data}"

    response = await client.chat.completions.create(
        model=settings.OPENROUTER_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("LLM returned empty content")
    return content


async def generate_summary(patient: Patient, notes: list[Note]) -> PatientSummary:
    if settings.SUMMARY_MODE == "llm" and settings.OPENROUTER_API_KEY:
        try:
            summary_text = await generate_llm_summary(patient, notes)
            return PatientSummary(summary=summary_text, mode="llm")
        except Exception:
            logger.warning(
                "LLM summary generation failed, falling back to template",
                exc_info=True,
            )

    summary_text = generate_template_summary(patient, notes)
    return PatientSummary(summary=summary_text, mode="template")
