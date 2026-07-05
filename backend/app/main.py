from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, tasks, users, ws
from app.core.config import settings
from app.core.exception_handlers import register_exception_handlers

app = FastAPI(
    title="Task Tracker API",
    description="A full-stack task tracker with RBAC and real-time updates.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(ws.router)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
