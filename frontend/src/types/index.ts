export type UserRole = "user" | "admin";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null;
  owner_id: string;
  owner: User | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedTasks {
  items: Task[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ApiError {
  error: {
    code: number;
    message: string;
    details?: unknown;
  };
}

export interface TaskCreateInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  due_date?: string | null;
}

export type TaskUpdateInput = Partial<TaskCreateInput>;

export type WsEvent =
  | { event: "task_created"; data: Task }
  | { event: "task_updated"; data: Task }
  | { event: "task_deleted"; data: { id: string } };
