import uuid


async def create_test_patient(client, **overrides):
    data = {
        "first_name": "Test",
        "last_name": "Patient",
        "date_of_birth": "1990-01-15",
        "gender": "Female",
        "email": "test@example.com",
        "phone": "555-0100",
        "address": "123 Test St",
        **overrides,
    }
    response = await client.post("/api/patients", json=data)
    assert response.status_code == 201
    return response.json()


async def test_summary_template_mode(client):
    patient = await create_test_patient(client)

    response = await client.get(f"/api/patients/{patient['id']}/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "template"
    assert "Test" in data["summary"]
    assert "Patient" in data["summary"]


async def test_summary_with_notes(client):
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
