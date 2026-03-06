"""
app/routers/charts.py
Эндпоинты для работы с сохранёнными натальными картами.
TSK-57: POST /api/charts/save
"""
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import InterfaceError, OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.natal_chart import (
    DuplicateChartInfo,
    SaveChartRequest,
    SaveChartResponse,
)
from app.services.chart_service import save_natal_chart

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/save",
    response_model=SaveChartResponse,
    status_code=201,
    summary="Сохранить натальную карту",
    responses={
        201: {
            "description": "Карта успешно сохранена",
            "model": SaveChartResponse,
        },
        409: {
            "description": "Карта с такими параметрами уже существует",
            "content": {
                "application/json": {
                    "example": {
                        "detail": {
                            "message": "Натальная карта с такими параметрами уже существует",
                            "chart_id": "550e8400-e29b-41d4-a716-446655440000",
                            "created_at": "2026-01-01T12:00:00+00:00",
                        }
                    }
                }
            },
        },
        422: {"description": "Ошибка валидации входных данных"},
        503: {"description": "База данных недоступна"},
    },
)
async def save_chart(
    request: SaveChartRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Сохранить рассчитанную натальную карту в PostgreSQL.

    **Workflow:**
    1. Рассчитай карту через `POST /api/astrology/calculate-chart-full`
    2. Передай результат сюда как `chart_data`

    **Duplicate detection:**
    Если карта с такой же комбинацией `birth_date + latitude + longitude`
    уже есть в БД — возвращает **HTTP 409** с существующим `chart_id`.
    Клиент может использовать этот ID вместо повторного сохранения.

    **Пример запроса:**
    ```json
    {
      "birth_date": "2000-01-01T12:00:00Z",
      "latitude": 55.7558,
      "longitude": 37.6173,
      "location_name": "Москва, Россия",
      "chart_data": {
        "planets": { "sun": { ... } },
        "houses":  { "ascendant": { ... }, "mc": { ... }, "houses": [...] },
        "aspects": [ ... ]
      }
    }
    ```
    """
    try:
        chart, is_duplicate = await save_natal_chart(
            db=db,
            birth_date=request.birth_date,
            latitude=request.latitude,
            longitude=request.longitude,
            planets_data=dict(request.chart_data.planets),
            houses_data=dict(request.chart_data.houses),
            aspects_data=(
                list(request.chart_data.aspects)
                if request.chart_data.aspects is not None
                else None
            ),
            location_name=request.location_name,
        )

    except (OperationalError, InterfaceError) as exc:
        logger.error("DB connection error in save_chart: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="База данных недоступна. Повторите запрос позже.",
        )
    except Exception as exc:
        logger.exception("Unexpected error in save_chart: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Внутренняя ошибка при сохранении карты: " + str(exc),
        )

    # Дубликат → 409 с chart_id уже существующей записи
    if is_duplicate:
        raise HTTPException(
            status_code=409,
            detail=DuplicateChartInfo(
                message="Натальная карта с такими параметрами уже существует",
                chart_id=str(chart.id),
                created_at=chart.created_at.isoformat(),
            ).model_dump(),
        )

    return SaveChartResponse(
        chart_id=chart.id,
        created_at=chart.created_at,
        message="Натальная карта успешно сохранена",
    )


@router.get(
    "/{chart_id}",
    summary="Получить карту по ID",
    responses={
        404: {"description": "Карта не найдена"},
        503: {"description": "База данных недоступна"},
    },
)
async def get_chart(
    chart_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Получить сохранённую натальную карту по UUID.

    Возвращает полные данные карты: birth_date, координаты, planets_data,
    houses_data, aspects_data.
    """
    import uuid

    try:
        uid = uuid.UUID(chart_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Некорректный формат UUID")

    from sqlalchemy import select
    from app.models.natal_chart import NatalChart

    try:
        result = await db.execute(
            select(NatalChart).where(NatalChart.id == uid)
        )
        chart = result.scalar_one_or_none()
    except (OperationalError, InterfaceError) as exc:
        logger.error("DB connection error in get_chart: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="База данных недоступна. Повторите запрос позже.",
        )

    if chart is None:
        raise HTTPException(status_code=404, detail="Карта не найдена")

    return {
        "chart_id":     str(chart.id),
        "birth_date":   chart.birth_date.isoformat(),
        "latitude":     chart.latitude,
        "longitude":    chart.longitude,
        "location_name": chart.location_name,
        "planets_data": chart.planets_data,
        "houses_data":  chart.houses_data,
        "aspects_data": chart.aspects_data,
        "created_at":   chart.created_at.isoformat(),
    }
