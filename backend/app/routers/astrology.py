from fastapi import APIRouter, HTTPException, Query, Depends
from app.schemas.natal_chart import (
    NatalChartRequest, 
    NatalChartResponse,
    NatalChartWithAspectsResponse
)
from app.services.astrology_service import get_natal_chart
from redis.asyncio import Redis
from app.db.redis import get_redis


# Создаём роутер
router = APIRouter()


@router.post("/calculate-chart", response_model=NatalChartResponse)
async def calculate_chart(request: NatalChartRequest):
    """
    Рассчитать натальную карту (планеты + дома).
    
    Args:
        request: NatalChartRequest с полями birth_date, latitude, longitude
    
    Returns:
        NatalChartResponse с планетами, домами, ASC, MC
    """
    try:
        chart = get_natal_chart(
            request.birth_date,
            request.latitude,
            request.longitude,
            include_aspects=False
        )
        return chart
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка расчёта натальной карты: {str(e)}"
        )


@router.post("/calculate-chart-full", response_model=NatalChartWithAspectsResponse)
async def calculate_chart_full(request: NatalChartRequest):
    """
    Рассчитать полную натальную карту (планеты + дома + аспекты).
    
    Args:
        request: NatalChartRequest с полями birth_date, latitude, longitude
    
    Returns:
        NatalChartWithAspectsResponse с планетами, домами, ASC, MC и аспектами
    """
    try:
        chart = get_natal_chart(
            request.birth_date,
            request.latitude,
            request.longitude,
            include_aspects=True
        )
        return chart
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка расчёта натальной карты: {str(e)}"
        )


@router.get("/health")
async def astrology_health():
    """Проверка работы модуля астрологии"""
    return {
        "status": "ok",
        "module": "astrology",
        "features": ["natal_chart", "planets", "houses", "aspects"]
    }


@router.post("/interpret-chart")
async def interpret_natal_chart(
    request: NatalChartRequest,
    redis: Redis = Depends(get_redis)
):
    """DeepSeek интерпретация натальной карты"""
    from app.services.deepseek_service import get_interpretation
    
    chart = get_natal_chart(
        request.birth_date,
        request.latitude,
        request.longitude,
        include_aspects=True
    )
    
    interpretation = await get_interpretation(chart, redis)
    return {"interpretation": interpretation}
