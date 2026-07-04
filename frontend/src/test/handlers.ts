import { http, HttpResponse } from "msw";
import type { PaginatedTasks, Task, User } from "../types";

const API_BASE = "http://localhost:8000";

export const mockUser: User = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "alice@example.com",
  full_name: "Alice Smith",
  role: "user",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

export const mockTask: Task = {
  id: "22222222-2222-2222-2222-222222222222",
  title: "Write report",
  description: "Q3 report for the team",
  status: "todo",
  due_date: "2026-08-01",
  owner_id: mockUser.id,
  owner: mockUser,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const mockPaginatedTasks: PaginatedTasks = {
  items: [mockTask],
  total: 1,
  page: 1,
  limit: 10,
  total_pages: 1,
};

export const handlers = [
  http.post(`${API_BASE}/api/v1/auth/register`, () => HttpResponse.json(mockUser, { status: 201 })),

  http.post(`${API_BASE}/api/v1/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.password === "wrongpassword") {
      return HttpResponse.json(
        { error: { code: 401, message: "Incorrect email or password" } },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      token_type: "bearer",
    });
  }),

  http.get(`${API_BASE}/api/v1/users/me`, () => HttpResponse.json(mockUser)),

  http.get(`${API_BASE}/api/v1/tasks`, () => HttpResponse.json(mockPaginatedTasks)),

  http.post(`${API_BASE}/api/v1/tasks`, async ({ request }) => {
    const body = (await request.json()) as Partial<Task>;
    return HttpResponse.json(
      { ...mockTask, id: "new-task-id", title: body.title ?? "" },
      { status: 201 },
    );
  }),

  http.put(`${API_BASE}/api/v1/tasks/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Partial<Task>;
    return HttpResponse.json({ ...mockTask, id: params.id as string, ...body });
  }),

  http.delete(`${API_BASE}/api/v1/tasks/:id`, () => new HttpResponse(null, { status: 204 })),
];
