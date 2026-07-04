import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { useTaskSocket } from "../hooks/useTaskSocket";
import { tasksApi } from "../api/tasks";
import type { Task, TaskCreateInput, TaskStatus } from "../types";
import { Navbar } from "../components/Navbar";
import { TaskCard } from "../components/TaskCard";
import { TaskFilters } from "../components/TaskFilters";
import { Pagination } from "../components/Pagination";
import { Modal } from "../components/Modal";
import { TaskForm } from "../components/TaskForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import "./TasksPage.css";

const PAGE_SIZE = 10;

export default function TasksPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [ownerId, setOwnerId] = useState("");

  const [formModal, setFormModal] = useState<"create" | Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Live updates: any task_created/updated/deleted event from the backend
  // patches the React Query cache directly -- see useTaskSocket.
  useTaskSocket(Boolean(user));

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tasks", page, status, ownerId],
    queryFn: () => tasksApi.list({ page, limit: PAGE_SIZE, status, owner_id: ownerId }),
    placeholderData: (previous) => previous,
  });

  const createMutation = useMutation({
    mutationFn: (input: TaskCreateInput) => tasksApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setFormModal(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskCreateInput }) => tasksApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setFormModal(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setTaskToDelete(null);
    },
  });

  function handleStatusChange(next: TaskStatus | "") {
    setStatus(next);
    setPage(1);
  }

  function handleOwnerChange(next: string) {
    setOwnerId(next);
    setPage(1);
  }

  return (
    <div className="tasks-page">
      <Navbar />

      <main className="tasks-main">
        <div className="tasks-toolbar">
          <div>
            <h1>Tasks</h1>
            <p className="tasks-subtitle">
              {isAdmin ? "Viewing tasks across the whole team." : "Your tasks, at a glance."}
            </p>
          </div>
          <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => setFormModal("create")}>
            + New task
          </button>
        </div>

        <TaskFilters
          status={status}
          onStatusChange={handleStatusChange}
          ownerId={ownerId}
          onOwnerChange={handleOwnerChange}
          isAdmin={isAdmin}
        />

        <div className="tasks-list">
          {isLoading && <p className="tasks-status-text">Loading tasks…</p>}

          {isError && (
            <p className="tasks-status-text tasks-status-error">
              Couldn't load tasks. Check that the backend is running and try again.
            </p>
          )}

          {!isLoading && !isError && data?.items.length === 0 && (
            <div className="tasks-empty">
              <p className="tasks-empty-title">No tasks here yet</p>
              <p className="tasks-empty-body">
                {status || ownerId
                  ? "Nothing matches these filters. Try clearing them."
                  : "Create your first task to get started."}
              </p>
            </div>
          )}

          {data?.items.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              showOwner={isAdmin}
              onEdit={() => setFormModal(task)}
              onDelete={() => setTaskToDelete(task)}
            />
          ))}
        </div>

        {data && (
          <Pagination page={data.page} totalPages={data.total_pages} total={data.total} onPageChange={setPage} />
        )}
      </main>

      {formModal && (
        <Modal title={formModal === "create" ? "New task" : "Edit task"} onClose={() => setFormModal(null)}>
          <TaskForm
            initialTask={formModal === "create" ? undefined : formModal}
            onCancel={() => setFormModal(null)}
            onSubmit={async (input) => {
              if (formModal === "create") {
                await createMutation.mutateAsync(input);
              } else {
                await updateMutation.mutateAsync({ id: formModal.id, input });
              }
            }}
          />
        </Modal>
      )}

      {taskToDelete && (
        <ConfirmDialog
          title="Delete task"
          message={`Are you sure you want to delete "${taskToDelete.title}"? This can't be undone.`}
          onCancel={() => setTaskToDelete(null)}
          onConfirm={() => deleteMutation.mutate(taskToDelete.id)}
          isBusy={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
