import { format, isPast } from "date-fns";
import type { Task } from "../types";
import { StatusBadge } from "./StatusBadge";
import "./TaskCard.css";

interface TaskCardProps {
  task: Task;
  showOwner?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, showOwner, onEdit, onDelete }: TaskCardProps) {
  const isOverdue = task.due_date && task.status !== "done" && isPast(new Date(task.due_date));

  return (
    <article className={`task-card task-card-${task.status}`}>
      <div className="task-card-body">
        <div className="task-card-header">
          <h3 className="task-card-title">{task.title}</h3>
          <StatusBadge status={task.status} />
        </div>

        {task.description && <p className="task-card-description">{task.description}</p>}

        <div className="task-card-meta">
          {task.due_date && (
            <span className={`task-card-due ${isOverdue ? "task-card-due-overdue" : ""}`}>
              Due {format(new Date(task.due_date), "MMM d, yyyy")}
              {isOverdue && " · overdue"}
            </span>
          )}
          {showOwner && task.owner && <span className="task-card-owner">{task.owner.full_name}</span>}
        </div>
      </div>

      <div className="task-card-actions">
        <button className="btn btn-secondary" onClick={onEdit}>
          Edit
        </button>
        <button className="btn btn-danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </article>
  );
}
