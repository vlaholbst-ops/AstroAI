"""
Модуль для астрологических расчётов (PoC позиции Солнца).
"""

from datetime import datetime
from pathlib import Path

from skyfield.api import Loader, Topos, wgs84


# Константы зодиака (знаки на английском, как в задаче)
ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]


# Инициализация Skyfield: загрузчик, timescale и эфемериды de421.bsp
BASE_DIR = Path(__file__).resolve().parent.parent.parent
EPHEMERIS_DIR = BASE_DIR / "ephemeris"

_loader = Loader(str(EPHEMERIS_DIR))
_ts = _loader.timescale()
_eph = _loader("de421.bsp")


def ecliptic_longitude_to_zodiac(longitude: float) -> dict:
    """
    Конвертирует эклиптическую долготу (0–360°) в знак зодиака и градус внутри знака.

    Пример: 35.5° -> {"sign": "Taurus", "degree": 5.5, "ecliptic_longitude": 35.5}
    """
    # Нормализация в диапазон 0–360
    longitude = longitude % 360.0

    # Определяем знак (каждые 30°)
    sign_index = int(longitude // 30.0)
    degree_in_sign = longitude % 30.0

    return {
        "sign": ZODIAC_SIGNS[sign_index],
        "degree": round(degree_in_sign, 2),
        "ecliptic_longitude": round(longitude, 2),
    }


def calculate_sun_position(birth_date: str, birth_time: str, latitude: float, longitude: float) -> dict:
    """
    Рассчитывает позицию Солнца в момент рождения.

    Args:
        birth_date: Дата рождения в формате 'YYYY-MM-DD' (UTC).
        birth_time: Время рождения в формате 'HH:MM:SS' (UTC).
        latitude: Широта места рождения (-90..90).
        longitude: Долгота места рождения (-180..180).

    Returns:
        dict: {
            "sign": "Aries",
            "degree": 5.23,
            "ecliptic_longitude": 5.23
        }
    """
    # 1. Парсинг даты и времени
    dt_str = f"{birth_date} {birth_time}"
    dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")

    # 2. Перевод в Skyfield-время (UTC)
    t = _ts.utc(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)

    # 3. Позиция наблюдателя на Земле
    location = wgs84.latlon(latitude_degrees=latitude, longitude_degrees=longitude)

    # 4. Расчёт положения Солнца
    earth = _eph["earth"]
    sun = _eph["sun"]
    observer = earth + location
    astrometric = observer.at(t).observe(sun)

    # 5. Эклиптические координаты (нам нужна долгота)
    lat_ecl, lon_ecl, distance = astrometric.ecliptic_latlon()
    ecl_longitude = lon_ecl.degrees  # 0–360°

    # 6. Конвертация долготы в знак и градус
    result = ecliptic_longitude_to_zodiac(ecl_longitude)
    return result