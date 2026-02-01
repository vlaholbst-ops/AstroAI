from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from redis.asyncio import Redis
from pydantic import BaseModel

from app.db.session import get_db
from app.db.redis import get_redis
from app.models.test import TestRecord

router = APIRouter(prefix="/test", tags=["Testing"])


# === Pydantic схемы ===
class TestMessage(BaseModel):
    message: str


class TestRecordResponse(BaseModel):
    id: int
    message: str
    created_at: str


# === PostgreSQL endpoints ===
@router.post("/db/write", response_model=TestRecordResponse)
async def write_to_db(
    data: TestMessage,
    db: AsyncSession = Depends(get_db)
):
    """Записать тестовое сообщение в PostgreSQL"""
    record = TestRecord(message=data.message)
    db.add(record)
    await db.commit()
    await db.refresh(record)
    
    return TestRecordResponse(
        id=record.id,
        message=record.message,
        created_at=record.created_at.isoformat()
    )


@router.get("/db/read/{record_id}", response_model=TestRecordResponse)
async def read_from_db(
    record_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Прочитать запись из PostgreSQL по ID"""
    result = await db.execute(
        select(TestRecord).where(TestRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    return TestRecordResponse(
        id=record.id,
        message=record.message,
        created_at=record.created_at.isoformat()
    )


# === Redis endpoints ===
@router.post("/redis/write")
async def write_to_redis(
    key: str,
    value: str,
    redis: Redis = Depends(get_redis)
):
    """Записать ключ-значение в Redis"""
    await redis.set(key, value, ex=3600)  # TTL 1 час
    return {
        "status": "success",
        "key": key,
        "value": value,
        "ttl_seconds": 3600
    }


@router.get("/redis/read/{key}")
async def read_from_redis(
    key: str,
    redis: Redis = Depends(get_redis)
):
    """Прочитать значение из Redis по ключу"""
    value = await redis.get(key)
    
    if value is None:
        raise HTTPException(status_code=404, detail="Key not found")
    
    ttl = await redis.ttl(key)
    
    return {
        "key": key,
        "value": value,
        "ttl_seconds": ttl
    }
