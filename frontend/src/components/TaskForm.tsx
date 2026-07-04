import { useState, type FormEvent } from "react";
import type { Task, TaskCreateInput, TaskStatus } from "../types";
import "./form.css";

interface TaskFormProps {
  initialTask?: Task;
  onSubmit: (input: TaskCreateInput) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({ initialTask, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [description, setDescription] = useState(initialTask?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status ?? "todo");
  const [dueDate, setDueDate] = useState(initialTask?.due_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title can't be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        status,
        due_date: dueDate || null,
      });
    } catch {
      setError("Couldn't save the task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="form-banner-error">{error}</div>}

      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          required
          maxLength={255}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to get done?"
          autoFocus
        />
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more detail (optional)"
        />
      </div>

      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="due_date">Due date</label>
        <input
          id="due_date"
          type="date"
          value={dueDate ?? ""}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : initialTask ? "Save changes" : "Create task"}
        </button>
      </div>
    </form>
  );
}
