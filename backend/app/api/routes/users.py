from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserRead

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("", response_model=list[UserRead])
async def list_users(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> list[User]:
    """Admin-only. Used by the frontend to populate the 'filter by owner' dropdown."""
    result = await db.execute(select(User).order_by(User.full_name))
    return list(result.scalars().all())
