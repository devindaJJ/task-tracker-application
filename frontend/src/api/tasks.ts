import { apiClient } from "./client";
import type { PaginatedTasks, Task, TaskCreateInput, TaskStatus, TaskUpdateInput, User } from "../types";

export interface TaskListParams {
  page?: number;
  limit?: number;
  status?: TaskStatus | "";
  owner_id?: string | "";
}

export const tasksApi = {
  list: (params: TaskListParams) =>
    apiClient
      .get<PaginatedTasks>("/api/v1/tasks", {
        params: {
          page: params.page,
          limit: params.limit,
          status: params.status || undefined,
          owner_id: params.owner_id || undefined,
        },
      })
      .then((r) => r.data),

  get: (id: string) => apiClient.get<Task>(`/api/v1/tasks/${id}`).then((r) => r.data),

  create: (input: TaskCreateInput) =>
    apiClient.post<Task>("/api/v1/tasks", input).then((r) => r.data),

  update: (id: string, input: TaskUpdateInput) =>
    apiClient.put<Task>(`/api/v1/tasks/${id}`, input).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/api/v1/tasks/${id}`),
};

export const usersApi = {
  list: () => apiClient.get<User[]>("/api/v1/users").then((r) => r.data),
};
