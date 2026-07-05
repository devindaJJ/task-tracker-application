"""
Import point that registers every SQLAlchemy model on `Base.metadata`.

This module exists purely so Alembic's autogenerate can "see" all models
by importing one thing, without creating a circular import between
`app.db.base` and the model modules themselves. Application code should
import `Base` from `app.db.base` directly and never needs this module.
"""
from app.db.base import Base  # noqa: F401
from app.models.task import Task  # noqa: F401
from app.models.user import User  # noqa: F401
