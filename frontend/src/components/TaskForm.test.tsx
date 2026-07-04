import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskForm } from "./TaskForm";

describe("TaskForm", () => {
  it("blocks submission when title is only whitespace", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    // Native `required` only rejects a fully empty field, so whitespace is
    // what actually exercises our own trim-based validation.
    await user.type(screen.getByLabelText(/title/i), "   ");
    await user.click(screen.getByRole("button", { name: /create task/i }));

    expect(await screen.findByText(/title can't be empty/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits trimmed title and null for empty optional fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText(/title/i), "  Ship the release  ");
    await user.click(screen.getByRole("button", { name: /create task/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Ship the release",
      description: null,
      status: "todo",
      due_date: null,
    });
  });

  it("pre-fills fields when editing an existing task", () => {
    render(
      <TaskForm
        initialTask={{
          id: "1",
          title: "Existing task",
          description: "Some detail",
          status: "in_progress",
          due_date: "2026-08-01",
          owner_id: "u1",
          owner: null,
          created_at: "",
          updated_at: "",
        }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/title/i)).toHaveValue("Existing task");
    expect(screen.getByLabelText(/description/i)).toHaveValue("Some detail");
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });
});
