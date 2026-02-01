from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from redis.asyncio import Redis

from app.core.config import settings
from app.db.session import get_db
from app.db.redis import init_redis, close_redis, get_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events: выполняется при запуске и остановке"""
    # Startup
    print("=" * 60)
    print("🚀 AstroAI Backend запущен")
    print(f"🔧 ENVIRONMENT: {settings.ENVIRONMENT}")
    print(f"🗄️  PostgreSQL: {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}")
    print(f"📦 Redis: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
    print("=" * 60)
    
    # Инициализация Redis
    await init_redis()
    
    yield  # Приложение работает
    
    # Shutdown
    await close_redis()
    print("🛑 AstroAI Backend остановлен")


app = FastAPI(
    title="AstroAI Backend",
    description="Backend API для расчёта натальных карт и AI-интерпретации",
    version="0.1.0",
    lifespan=lifespan
)


@app.get("/health")
async def health_check():
    """Проверка работоспособности API"""
    return {
        "status": "ok",
        "service": "AstroAI Backend",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/db-check")
async def db_check(
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis)
):
    """Проверка подключения к PostgreSQL и Redis"""
    # PostgreSQL
    try:
        result = await db.execute(text("SELECT 1"))
        postgres_status = "✅ connected"
        postgres_version = await db.execute(text("SELECT version()"))
        postgres_info = postgres_version.scalar()
    except Exception as e:
        postgres_status = f"❌ error: {str(e)}"
        postgres_info = None
    
    # Redis
    try:
        await redis.ping()
        redis_status = "✅ connected"
        redis_info = await redis.info("server")
        redis_version = redis_info.get("redis_version", "unknown")
    except Exception as e:
        redis_status = f"❌ error: {str(e)}"
        redis_version = None
    
    return {
        "postgresql": {
            "status": postgres_status,
            "host": settings.POSTGRES_HOST,
            "port": settings.POSTGRES_PORT,
            "database": settings.POSTGRES_DB,
            "version": postgres_info[:80] if postgres_info else None
        },
        "redis": {
            "status": redis_status,
            "host": settings.REDIS_HOST,
            "port": settings.REDIS_PORT,
            "version": redis_version
        }
    }


@app.get("/ping")
async def ping():
    """Быстрый ping"""
    return {"message": "pong"}
