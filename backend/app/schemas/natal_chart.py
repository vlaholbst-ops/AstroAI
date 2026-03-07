from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid as uuid_module


class NatalChartRequest(BaseModel):
    """Запрос для расчёта натальной карты"""
    birth_date: datetime = Field(
        ...,
        description="Дата и время рождения в UTC (формат ISO 8601)",
        example="2000-01-01T12:00:00Z"
    )
    latitude: float = Field(
        ...,
        description="Широта места рождения в градусах",
        ge=-90,
        le=90,
        example=55.7558
    )
    longitude: float = Field(
        ...,
        description="Долгота места рождения в градусах",
        ge=-180,
        le=180,
        example=37.6173
    )


class PlanetPosition(BaseModel):
    """Позиция планеты"""
    planet: str
    zodiac_sign: str
    degree: float
    longitude: float
    retrograde: bool


class HousePosition(BaseModel):
    """Позиция куспида дома"""
    house: int
    zodiac_sign: str
    degree: float
    longitude: float


class AnglePosition(BaseModel):
    """Позиция угла карты (ASC, MC)"""
    zodiac_sign: str
    degree: float
    longitude: float


class HousesData(BaseModel):
    """Данные о домах"""
    ascendant: AnglePosition
    mc: AnglePosition
    houses: List[HousePosition]


class NatalChartResponse(BaseModel):
    """Ответ с натальной картой"""
    planets: Dict[str, PlanetPosition]
    houses: HousesData

    class Config:
        json_schema_extra = {
            "example": {
                "planets": {
                    "sun": {
                        "planet": "Sun",
                        "zodiac_sign": "capricorn",
                        "degree": 10.38,
                        "longitude": 280.38,
                        "retrograde": False
                    }
                },
                "houses": {
                    "ascendant": {
                        "zodiac_sign": "gemini",
                        "degree": 27.79,
                        "longitude": 87.79
                    },
                    "mc": {
                        "zodiac_sign": "aquarius",
                        "degree": 15.61,
                        "longitude": 315.61
                    },
                    "houses": [
                        {
                            "house": 1,
                            "zodiac_sign": "gemini",
                            "degree": 27.79,
                            "longitude": 87.79
                        }
                    ]
                }
            }
        }


class AspectData(BaseModel):
    """Аспект между двумя планетами"""
    planet1: str
    planet2: str
    aspect_type: str
    aspect_symbol: str
    angle: float
    exact_angle: int
    orb: float
    planet1_position: str
    planet2_position: str


class NatalChartWithAspectsResponse(BaseModel):
    """Ответ с натальной картой и аспектами"""
    planets: Dict[str, PlanetPosition]
    houses: HousesData
    aspects: List[AspectData]


# ─── TSK-57: Схемы для сохранения карты в БД ─────────────────────────────────

class ChartDataContent(BaseModel):
    """
    Содержимое chart_data — результат /calculate-chart-full.
    Принимает тот же JSON, который возвращает бэкенд.
    """
    planets: Dict[str, Any] = Field(
        ...,
        description="Позиции планет (ключ — имя планеты en, значение — PlanetPosition)"
    )
    houses: Dict[str, Any] = Field(
        ...,
        description="Дома и угловые точки (ascendant, mc, houses[])"
    )
    aspects: Optional[List[Any]] = Field(
        None,
        description="Аспекты между планетами (из /calculate-chart-full)"
    )


class SaveChartRequest(BaseModel):
    """
    Запрос на сохранение рассчитанной натальной карты в БД.

    Принимает данные рождения + результат расчёта (chart_data).
    Карта сохраняется анонимно (user_id=null) — авторизация вне MVP-скопа.
    """
    birth_date: datetime = Field(
        ...,
        description="Дата и время рождения в UTC (ISO 8601)",
        example="2000-01-01T12:00:00Z"
    )
    latitude: float = Field(
        ...,
        description="Широта места рождения (-90..90)",
        ge=-90,
        le=90,
        example=55.7558
    )
    longitude: float = Field(
        ...,
        description="Долгота места рождения (-180..180)",
        ge=-180,
        le=180,
        example=37.6173
    )
    location_name: Optional[str] = Field(
        None,
        description="Название города/места (опционально)",
        max_length=255,
        example="Москва, Россия"
    )
    chart_data: ChartDataContent = Field(
        ...,
        description="Результат /calculate-chart-full — planets + houses + aspects"
    )

    @field_validator("birth_date")
    @classmethod
    def ensure_utc(cls, v: datetime) -> datetime:
        """Если timezone не указан — считаем UTC."""
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v


class SaveChartResponse(BaseModel):
    """Ответ после успешного сохранения натальной карты."""
    chart_id: uuid_module.UUID = Field(
        ...,
        description="UUID сохранённой карты"
    )
    created_at: datetime = Field(
        ...,
        description="Время создания записи в БД"
    )
    message: str = Field(
        "Натальная карта успешно сохранена",
        description="Статусное сообщение"
    )

    model_config = {"from_attributes": True}


class DuplicateChartInfo(BaseModel):
    """Детали ошибки при обнаружении дубликата (HTTP 409)."""
    message: str
    chart_id: str
    created_at: str
