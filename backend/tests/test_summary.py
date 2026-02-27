import uuid
from unittest.mock import patch

from tests.conftest import create_test_patient


@patch("app.services.summary_service.settings")
async def test_summary_template_mode(mock_settings, client):
    mock_settings.SUMMARY_MODE = "template"
    mock_settings.OPENROUTER_API_KEY = ""
    patient = await create_test_patient(client)

    response = await client.get(f"/api/patients/{patient['id']}/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "template"
    assert "Test" in data["summary"]
    assert "Patient" in data["summary"]


@patch("app.services.summary_service.settings")
async def test_summary_with_notes(mock_settings, client):
    mock_settings.SUMMARY_MODE = "template"
    mock_settings.OPENROUTER_API_KEY = ""
    patient = await create_test_patient(client)
    pid = patient["id"]

    await client.post(
        f"/api/patients/{pid}/notes",
        json={
            "content": "Patient shows signs of improvement",
            "timestamp": "2025-01-15T10:00:00Z",
        },
    )

    response = await client.get(f"/api/patients/{pid}/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "template"
    assert "improvement" in data["summary"]


async def test_summary_not_found(client):
    response = await client.get(f"/api/patients/{uuid.uuid4()}/summary")
    assert response.status_code == 404
