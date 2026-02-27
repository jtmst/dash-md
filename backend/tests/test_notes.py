import uuid

from tests.conftest import create_test_patient


async def create_test_note(client, patient_id):
    data = {
        "content": "Test clinical note",
        "timestamp": "2025-01-15T10:00:00Z",
    }
    response = await client.post(f"/api/patients/{patient_id}/notes", json=data)
    assert response.status_code == 201
    return response.json()


async def test_create_note(client):
    patient = await create_test_patient(client)
    note = await create_test_note(client, patient["id"])
    assert "id" in note
    assert note["content"] == "Test clinical note"
    assert note["patient_id"] == patient["id"]


async def test_create_note_invalid_patient(client):
    data = {
        "content": "Test clinical note",
        "timestamp": "2025-01-15T10:00:00Z",
    }
    response = await client.post(f"/api/patients/{uuid.uuid4()}/notes", json=data)
    assert response.status_code == 404


async def test_list_notes(client):
    patient = await create_test_patient(client)
    pid = patient["id"]

    await client.post(
        f"/api/patients/{pid}/notes",
        json={
            "content": "First note",
            "timestamp": "2025-01-10T10:00:00Z",
        },
    )
    await client.post(
        f"/api/patients/{pid}/notes",
        json={
            "content": "Second note",
            "timestamp": "2025-01-15T10:00:00Z",
        },
    )

    response = await client.get(f"/api/patients/{pid}/notes")
    assert response.status_code == 200
    notes = response.json()
    assert len(notes) == 2
    assert notes[0]["content"] == "Second note"
    assert notes[1]["content"] == "First note"


async def test_list_notes_empty(client):
    patient = await create_test_patient(client)
    response = await client.get(f"/api/patients/{patient['id']}/notes")
    assert response.status_code == 200
    assert response.json() == []


async def test_delete_note(client):
    patient = await create_test_patient(client)
    note = await create_test_note(client, patient["id"])

    response = await client.delete(f"/api/patients/{patient['id']}/notes/{note['id']}")
    assert response.status_code == 204

    response = await client.get(f"/api/patients/{patient['id']}/notes")
    assert response.json() == []


async def test_delete_note_wrong_patient(client):
    patient_a = await create_test_patient(client)
    patient_b = await create_test_patient(client)
    note = await create_test_note(client, patient_a["id"])

    response = await client.delete(
        f"/api/patients/{patient_b['id']}/notes/{note['id']}"
    )
    assert response.status_code == 404


async def test_cascade_delete(client):
    patient = await create_test_patient(client)
    pid = patient["id"]
    await create_test_note(client, pid)
    await create_test_note(client, pid)

    response = await client.delete(f"/api/patients/{pid}")
    assert response.status_code == 204

    response = await client.get(f"/api/patients/{pid}")
    assert response.status_code == 404

    response = await client.get(f"/api/patients/{pid}/notes")
    assert response.status_code == 404
