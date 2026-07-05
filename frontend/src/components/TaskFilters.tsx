import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../api/tasks";
import type { TaskStatus } from "../types";
import "./TaskFilters.css";

interface TaskFiltersProps {
  status: TaskStatus | "";
  onStatusChange: (status: TaskStatus | "") => void;
  ownerId: string;
  onOwnerChange: (ownerId: string) => void;
  isAdmin: boolean;
}

export function TaskFilters({ status, onStatusChange, ownerId, onOwnerChange, isAdmin }: TaskFiltersProps) {
  // Only admins can filter by owner (and only admins can see the /users
  // list endpoint in the first place), so we skip this query for regular
  // users entirely rather than letting it fail against a 403.
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
    enabled: isAdmin,
  });

  return (
    <div className="task-filters">
      <div className="task-filters-group">
        <label htmlFor="filter-status">Status</label>
        <select
          id="filter-status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus | "")}
        >
          <option value="">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      {isAdmin && (
        <div className="task-filters-group">
          <label htmlFor="filter-owner">Owner</label>
          <select id="filter-owner" value={ownerId} onChange={(e) => onOwnerChange(e.target.value)}>
            <option value="">Everyone</option>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
