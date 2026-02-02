from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.astrology_calculator import calculate_sun_position


router = APIRouter(prefix="/astrology", tags=["Astrology"])


class BirthDataRequest(BaseModel):
    """
    Входные данные для расчёта позиции Солнца.
    """
    birth_date: str = Field(..., description="Дата рождения в формате YYYY-MM-DD (UTC)")
    birth_time: str = Field(..., description="Время рождения в формате HH:MM:SS (UTC)")
    latitude: float = Field(..., ge=-90, le=90, description="Широта (-90..90)")
    longitude: float = Field(..., ge=-180, le=180, description="Долгота (-180..180)")


@router.post("/sun-position")
def get_sun_position(data: BirthDataRequest):
    """
    Рассчитать позицию Солнца на момент рождения.
    """
    try:
        result = calculate_sun_position(
            birth_date=data.birth_date,
            birth_time=data.birth_time,
            latitude=data.latitude,
            longitude=data.longitude,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")