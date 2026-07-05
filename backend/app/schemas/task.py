import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.task import TaskStatus
from app.schemas.user import UserRead


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    status: TaskStatus = TaskStatus.TODO
    due_date: date | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    """All fields optional to support partial updates via PATCH-like semantics on PUT."""

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    status: TaskStatus | None = None
    due_date: date | None = None


class TaskRead(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    owner: UserRead | None = None
    created_at: datetime
    updated_at: datetime


class PaginatedTasks(BaseModel):
    items: list[TaskRead]
    total: int
    page: int
    limit: int
    total_pages: int
