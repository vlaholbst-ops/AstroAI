from sqlalchemy import text
from app.db.session import engine, Base
from app.models.test import TestRecord  # noqa: F401
# Регистрируем production-модели в Base.metadata
from app.models import User, Subscription, NatalChart, AIInterpretation  # noqa: F401


async def create_tables():
    """Создать все таблицы в БД"""
    async with engine.begin() as conn:
        # Удалить таблицу если существует (для теста)
        await conn.execute(text("DROP TABLE IF EXISTS test_records"))
        
        # Создать все таблицы из Base
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Таблицы созданы")


async def drop_tables():
    """Удалить все таблицы"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    print("🗑️  Таблицы удалены")
