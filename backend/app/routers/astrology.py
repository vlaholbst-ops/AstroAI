from fastapi import APIRouter, HTTPException
from app.schemas.natal_chart import NatalChartRequest, NatalChartResponse
from app.services.astrology_service import get_natal_chart

# Создаём роутер
router = APIRouter()


@router.post("/calculate-chart", response_model=NatalChartResponse)
async def calculate_chart(request: NatalChartRequest):
    """
    Рассчитать натальную карту по дате, времени и месту рождения.
    
    Args:
        request: NatalChartRequest с полями birth_date, latitude, longitude
    
    Returns:
        NatalChartResponse с планетами, домами, ASC, MC
    """
    try:
        chart = get_natal_chart(
            request.birth_date,
            request.latitude,
            request.longitude
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
        "features": ["natal_chart", "planets", "houses"]
    }
