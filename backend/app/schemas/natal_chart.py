from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, List, Optional


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
                        "zodiac_sign": "Козерог",
                        "degree": 10.38,
                        "longitude": 280.38,
                        "retrograde": False
                    }
                },
                "houses": {
                    "ascendant": {
                        "zodiac_sign": "Близнецы",
                        "degree": 27.79,
                        "longitude": 87.79
                    },
                    "mc": {
                        "zodiac_sign": "Водолей",
                        "degree": 15.61,
                        "longitude": 315.61
                    },
                    "houses": [
                        {
                            "house": 1,
                            "zodiac_sign": "Близнецы",
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
