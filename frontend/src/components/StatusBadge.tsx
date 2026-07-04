import type { TaskStatus } from "../types";
import "./StatusBadge.css";

const LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`status-badge status-badge-${status}`}>{LABELS[status]}</span>;
}
