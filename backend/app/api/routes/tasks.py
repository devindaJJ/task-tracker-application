import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.task import Task, TaskStatus
from app.models.user import User, UserRole
from app.schemas.task import PaginatedTasks, TaskCreate, TaskRead, TaskUpdate
from app.ws.manager import manager

router = APIRouter(prefix="/api/v1/tasks", tags=["Tasks"])


async def _get_owned_task_or_404(task_id: uuid.UUID, current_user: User, db: AsyncSession) -> Task:
    """Fetch a task, enforcing that non-admins can only access their own tasks."""
    result = await db.execute(
        select(Task).options(selectinload(Task.owner)).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if current_user.role != UserRole.ADMIN and task.owner_id != current_user.id:
        # 404 rather than 403 to avoid leaking existence of tasks the user can't access
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    return task


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Task:
    task = Task(**payload.model_dump(), owner_id=current_user.id)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    await db.refresh(task, attribute_names=["owner"])

    await manager.broadcast_task_event(
        "task_created", TaskRead.model_validate(task).model_dump(mode="json"), task.owner_id
    )
    return task


@router.get("", response_model=PaginatedTasks)
async def list_tasks(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    owner_id: uuid.UUID | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedTasks:
    query = select(Task).options(selectinload(Task.owner))
    count_query = select(func.count()).select_from(Task)

    if current_user.role != UserRole.ADMIN:
        query = query.where(Task.owner_id == current_user.id)
        count_query = count_query.where(Task.owner_id == current_user.id)
    elif owner_id is not None:
        query = query.where(Task.owner_id == owner_id)
        count_query = count_query.where(Task.owner_id == owner_id)

    if status_filter is not None:
        query = query.where(Task.status == status_filter)
        count_query = count_query.where(Task.status == status_filter)

    total = (await db.execute(count_query)).scalar_one()

    query = query.order_by(Task.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    tasks = result.scalars().all()

    total_pages = math.ceil(total / limit) if total > 0 else 1

    return PaginatedTasks(
        items=[TaskRead.model_validate(t) for t in tasks],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Task:
    return await _get_owned_task_or_404(task_id, current_user, db)


@router.put("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Task:
    task = await _get_owned_task_or_404(task_id, current_user, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)
    await db.refresh(task, attribute_names=["owner"])

    await manager.broadcast_task_event(
        "task_updated", TaskRead.model_validate(task).model_dump(mode="json"), task.owner_id
    )
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    task = await _get_owned_task_or_404(task_id, current_user, db)
    task_id_str = str(task.id)
    owner_id = task.owner_id

    await db.delete(task)
    await db.commit()

    await manager.broadcast_task_event("task_deleted", {"id": task_id_str}, owner_id)
