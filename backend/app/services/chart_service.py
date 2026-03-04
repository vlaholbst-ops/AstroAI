"""
app/services/chart_service.py
Бизнес-логика сохранения натальных карт в PostgreSQL.
TSK-57: POST /api/charts/save
"""
from datetime import datetime
from typing import Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.natal_chart import NatalChart


async def save_natal_chart(
    db: AsyncSession,
    birth_date: datetime,
    latitude: float,
    longitude: float,
    planets_data: dict,
    houses_data: dict,
    aspects_data: Optional[list],
    location_name: Optional[str] = None,
) -> Tuple[NatalChart, bool]:
    """
    Сохранить натальную карту в БД.

    Duplicate detection: если уже существует запись с теми же
    (birth_date, latitude, longitude), возвращает её с флагом is_duplicate=True.
    Благодаря этому эндпоинт остаётся идемпотентным: клиент получает 409
    и уже существующий chart_id, не создавая дубликатов.

    Args:
        db:            Async SQLAlchemy сессия (Depends(get_db))
        birth_date:    Дата/время рождения в UTC (с tzinfo)
        latitude:      Широта (-90..90)
        longitude:     Долгота (-180..180)
        planets_data:  Dict с позициями планет (из chart_data.planets)
        houses_data:   Dict с домами и углами (из chart_data.houses)
        aspects_data:  List аспектов или None (из chart_data.aspects)
        location_name: Необязательное название города

    Returns:
        Tuple[NatalChart, bool] — (запись, is_duplicate)

    Raises:
        sqlalchemy.exc.OperationalError:  БД недоступна
        sqlalchemy.exc.InterfaceError:    Проблема с соединением
        Exception:                        Прочие ошибки БД
    """
    # ── 1. Проверка на дубликат ───────────────────────────────────────────────
    stmt = (
        select(NatalChart)
        .where(
            NatalChart.birth_date == birth_date,
            NatalChart.latitude   == latitude,
            NatalChart.longitude  == longitude,
        )
        .limit(1)
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing is not None:
        return existing, True  # (chart, is_duplicate=True)

    # ── 2. Создать новую запись ───────────────────────────────────────────────
    chart = NatalChart(
        birth_date=birth_date,
        latitude=latitude,
        longitude=longitude,
        location_name=location_name,
        planets_data=planets_data,
        houses_data=houses_data,
        aspects_data=aspects_data,
        # user_id=None  — анонимное сохранение (авторизация вне MVP-скопа)
    )

    db.add(chart)
    await db.commit()
    await db.refresh(chart)  # Подтянуть server_default поля (id, created_at)

    return chart, False  # (chart, is_duplicate=False)
