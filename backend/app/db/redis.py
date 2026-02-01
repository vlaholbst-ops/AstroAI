from redis.asyncio import Redis
from app.core.config import settings

redis_client: Redis | None = None


async def get_redis() -> Redis:
    """Получить клиент Redis"""
    if redis_client is None:
        raise RuntimeError("Redis client не инициализирован")
    return redis_client


async def init_redis():
    """Инициализация Redis при запуске"""
    global redis_client
    redis_client = Redis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )
    print(f"✅ Redis подключен: {settings.REDIS_HOST}:{settings.REDIS_PORT}")


async def close_redis():
    """Закрытие Redis при остановке"""
    global redis_client
    if redis_client:
        await redis_client.close()
        print("🛑 Redis отключен")
