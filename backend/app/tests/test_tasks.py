import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


def auth_header(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}


async def test_create_task_requires_auth(client: AsyncClient):
    response = await client.post("/api/v1/tasks", json={"title": "No auth task"})
    assert response.status_code == 401


async def test_create_task_success(client: AsyncClient, alice_tokens: dict):
    response = await client.post(
        "/api/v1/tasks",
        json={"title": "Write report", "description": "Q3", "status": "todo"},
        headers=auth_header(alice_tokens),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Write report"
    assert body["status"] == "todo"


async def test_create_task_empty_title_returns_422(client: AsyncClient, alice_tokens: dict):
    response = await client.post(
        "/api/v1/tasks", json={"title": ""}, headers=auth_header(alice_tokens)
    )
    assert response.status_code == 422


async def test_user_only_sees_own_tasks(client: AsyncClient, alice_tokens: dict, bob_tokens: dict):
    await client.post("/api/v1/tasks", json={"title": "Alice task"}, headers=auth_header(alice_tokens))
    await client.post("/api/v1/tasks", json={"title": "Bob task"}, headers=auth_header(bob_tokens))

    alice_list = await client.get("/api/v1/tasks", headers=auth_header(alice_tokens))
    assert alice_list.status_code == 200
    assert alice_list.json()["total"] == 1
    assert alice_list.json()["items"][0]["title"] == "Alice task"

    bob_list = await client.get("/api/v1/tasks", headers=auth_header(bob_tokens))
    assert bob_list.json()["total"] == 1
    assert bob_list.json()["items"][0]["title"] == "Bob task"


async def test_user_cannot_get_others_task_by_id(
    client: AsyncClient, alice_tokens: dict, bob_tokens: dict
):
    create_resp = await client.post(
        "/api/v1/tasks", json={"title": "Alice private task"}, headers=auth_header(alice_tokens)
    )
    task_id = create_resp.json()["id"]

    response = await client.get(f"/api/v1/tasks/{task_id}", headers=auth_header(bob_tokens))
    assert response.status_code == 404


async def test_user_cannot_update_others_task(
    client: AsyncClient, alice_tokens: dict, bob_tokens: dict
):
    create_resp = await client.post(
        "/api/v1/tasks", json={"title": "Alice task"}, headers=auth_header(alice_tokens)
    )
    task_id = create_resp.json()["id"]

    response = await client.put(
        f"/api/v1/tasks/{task_id}", json={"status": "done"}, headers=auth_header(bob_tokens)
    )
    assert response.status_code == 404


async def test_user_cannot_delete_others_task(
    client: AsyncClient, alice_tokens: dict, bob_tokens: dict
):
    create_resp = await client.post(
        "/api/v1/tasks", json={"title": "Alice task"}, headers=auth_header(alice_tokens)
    )
    task_id = create_resp.json()["id"]

    response = await client.delete(f"/api/v1/tasks/{task_id}", headers=auth_header(bob_tokens))
    assert response.status_code == 404


async def test_owner_can_update_own_task(client: AsyncClient, alice_tokens: dict):
    create_resp = await client.post(
        "/api/v1/tasks", json={"title": "Original", "status": "todo"}, headers=auth_header(alice_tokens)
    )
    task_id = create_resp.json()["id"]

    response = await client.put(
        f"/api/v1/tasks/{task_id}",
        json={"title": "Updated", "status": "done"},
        headers=auth_header(alice_tokens),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Updated"
    assert body["status"] == "done"


async def test_owner_can_delete_own_task(client: AsyncClient, alice_tokens: dict):
    create_resp = await client.post(
        "/api/v1/tasks", json={"title": "To delete"}, headers=auth_header(alice_tokens)
    )
    task_id = create_resp.json()["id"]

    delete_resp = await client.delete(f"/api/v1/tasks/{task_id}", headers=auth_header(alice_tokens))
    assert delete_resp.status_code == 204

    get_resp = await client.get(f"/api/v1/tasks/{task_id}", headers=auth_header(alice_tokens))
    assert get_resp.status_code == 404


async def test_filter_by_status(client: AsyncClient, alice_tokens: dict):
    await client.post("/api/v1/tasks", json={"title": "T1", "status": "todo"}, headers=auth_header(alice_tokens))
    await client.post("/api/v1/tasks", json={"title": "T2", "status": "done"}, headers=auth_header(alice_tokens))
    await client.post("/api/v1/tasks", json={"title": "T3", "status": "done"}, headers=auth_header(alice_tokens))

    response = await client.get("/api/v1/tasks?status=done", headers=auth_header(alice_tokens))
    body = response.json()
    assert body["total"] == 2
    assert all(item["status"] == "done" for item in body["items"])


async def test_pagination(client: AsyncClient, alice_tokens: dict):
    for i in range(5):
        await client.post(
            "/api/v1/tasks", json={"title": f"Task {i}"}, headers=auth_header(alice_tokens)
        )

    page1 = await client.get("/api/v1/tasks?page=1&limit=2", headers=auth_header(alice_tokens))
    body1 = page1.json()
    assert body1["total"] == 5
    assert body1["total_pages"] == 3
    assert len(body1["items"]) == 2

    page3 = await client.get("/api/v1/tasks?page=3&limit=2", headers=auth_header(alice_tokens))
    assert len(page3.json()["items"]) == 1


async def test_regular_user_cannot_list_users(client: AsyncClient, bob_tokens: dict):
    response = await client.get("/api/v1/users", headers=auth_header(bob_tokens))
    assert response.status_code == 403


async def test_admin_can_see_all_tasks_and_users(
    client: AsyncClient, alice_tokens: dict, bob_tokens: dict, promote_to_admin
):
    await client.post("/api/v1/tasks", json={"title": "Alice task"}, headers=auth_header(alice_tokens))
    await client.post("/api/v1/tasks", json={"title": "Bob task"}, headers=auth_header(bob_tokens))

    bob_admin_tokens = await promote_to_admin("bob@example.com", "SecurePass456")

    all_tasks = await client.get("/api/v1/tasks", headers=auth_header(bob_admin_tokens))
    assert all_tasks.json()["total"] == 2

    users_resp = await client.get("/api/v1/users", headers=auth_header(bob_admin_tokens))
    assert users_resp.status_code == 200
    assert len(users_resp.json()) == 2


async def test_admin_can_access_others_task_by_id(
    client: AsyncClient, alice_tokens: dict, bob_tokens: dict, promote_to_admin
):
    create_resp = await client.post(
        "/api/v1/tasks", json={"title": "Alice task"}, headers=auth_header(alice_tokens)
    )
    task_id = create_resp.json()["id"]

    bob_admin_tokens = await promote_to_admin("bob@example.com", "SecurePass456")
    response = await client.get(f"/api/v1/tasks/{task_id}", headers=auth_header(bob_admin_tokens))
    assert response.status_code == 200
