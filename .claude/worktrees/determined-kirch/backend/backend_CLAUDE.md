# Backend

FastAPI + PostgreSQL + Redis + GigaChat. Python 3.13.

## Quick Start
```bash
source venv/bin/activate
docker-compose up -d postgres redis
uvicorn app.main:app --reload
# Swagger: http://127.0.0.1:8000/docs
```

## Where Things Live
- Расчёты: `app/services/astrology_calculator.py` — **единственный** файл для астрологической логики
- AI: `app/services/gigachat_service.py` — GigaChat интеграция
- Endpoints: `app/routers/astrology.py`
- Schemas: `app/schemas/natal_chart.py`
- Config: `app/core/config.py` (читает `.env`)
- DB sessions: `app/db/session.py`

## Patterns
- **Router → Service → Calculator** — не ходить из роутера напрямую в калькулятор
- **Dependency Injection:** `redis: Redis = Depends(get_redis)`
- **Lifespan events** для startup/shutdown (init_redis, create_tables)
- **Async everywhere:** `create_async_engine`, `AsyncSessionLocal`, `redis.asyncio`

## Testing
```bash
pytest tests/
pytest tests/test_astrology.py -v  # Конкретный файл
```
