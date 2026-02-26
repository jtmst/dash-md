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


async def test_create_patient(client):
    patient = await create_test_patient(client)
    assert "id" in patient
    uuid.UUID(patient["id"])
    assert patient["first_name"] == "Test"
    assert patient["last_name"] == "Patient"
    assert patient["date_of_birth"] == "1990-01-15"
    assert patient["gender"] == "Female"
    assert patient["email"] == "test@example.com"


async def test_create_patient_validation_error(client):
    response = await client.post("/api/patients", json={})
    assert response.status_code == 422


async def test_create_patient_invalid_email(client):
    response = await client.post(
        "/api/patients",
        json={
            "first_name": "Test",
            "last_name": "Patient",
            "date_of_birth": "1990-01-15",
            "gender": "Female",
            "email": "not-an-email",
            "phone": "555-0100",
            "address": "123 Test St",
        },
    )
    assert response.status_code == 422


async def test_list_patients_empty(client):
    response = await client.get("/api/patients")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


async def test_list_patients_pagination(client):
    for i in range(3):
        await create_test_patient(client, email=f"test{i}@example.com")

    response = await client.get("/api/patients", params={"limit": 2})
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 3


async def test_list_patients_search(client):
    await create_test_patient(
        client, first_name="Alice", last_name="Wonderland", email="alice@example.com"
    )
    await create_test_patient(
        client, first_name="Bob", last_name="Builder", email="bob@example.com"
    )

    response = await client.get("/api/patients", params={"search": "Alice"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["first_name"] == "Alice"


async def test_list_patients_status_filter(client):
    await create_test_patient(client, status="active", email="active@example.com")
    await create_test_patient(client, status="critical", email="critical@example.com")

    response = await client.get("/api/patients", params={"status": "critical"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["status"] == "critical"


async def test_get_patient(client):
    patient = await create_test_patient(client)

    response = await client.get(f"/api/patients/{patient['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == patient["id"]
    assert data["first_name"] == "Test"


async def test_get_patient_not_found(client):
    response = await client.get(f"/api/patients/{uuid.uuid4()}")
    assert response.status_code == 404


async def test_update_patient(client):
    patient = await create_test_patient(client)

    update_data = {
        "first_name": "Updated",
        "last_name": "Name",
        "date_of_birth": "1990-01-15",
        "gender": "Female",
        "email": "updated@example.com",
        "phone": "555-0200",
        "address": "456 Updated Ave",
    }
    response = await client.put(f"/api/patients/{patient['id']}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Updated"
    assert data["last_name"] == "Name"
    assert data["email"] == "updated@example.com"


async def test_update_patient_not_found(client):
    update_data = {
        "first_name": "Updated",
        "last_name": "Name",
        "date_of_birth": "1990-01-15",
        "gender": "Female",
        "email": "updated@example.com",
        "phone": "555-0200",
        "address": "456 Updated Ave",
    }
    response = await client.put(f"/api/patients/{uuid.uuid4()}", json=update_data)
    assert response.status_code == 404


async def test_delete_patient(client):
    patient = await create_test_patient(client)

    response = await client.delete(f"/api/patients/{patient['id']}")
    assert response.status_code == 204

    response = await client.get(f"/api/patients/{patient['id']}")
    assert response.status_code == 404


async def test_delete_patient_not_found(client):
    response = await client.delete(f"/api/patients/{uuid.uuid4()}")
    assert response.status_code == 404
