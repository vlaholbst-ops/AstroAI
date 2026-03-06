from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.session import Base


class TestRecord(Base):
    """Тестовая модель для проверки работы БД"""
    __tablename__ = "test_records"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<TestRecord(id={self.id}, message='{self.message}')>"
