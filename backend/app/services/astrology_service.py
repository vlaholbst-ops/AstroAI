import sys
from pathlib import Path

# Добавляем корень проекта в sys.path для импорта astro_calculator
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from astro_calculator import calculate_natal_chart, calculate_houses, calculate_aspects


def get_natal_chart(birth_dt, lat, lon, include_aspects=False):
    """
    Получить натальную карту с планетами и домами.
    
    Args:
        birth_dt: datetime рождения
        lat: широта
        lon: долгота
        include_aspects: включить расчёт аспектов (по умолчанию False)
    
    Returns:
        dict с планетами, домами и опционально аспектами
    """
    planets = calculate_natal_chart(birth_dt, lat, lon)
    houses = calculate_houses(birth_dt, lat, lon)
    
    result = {
        "planets": planets,
        "houses": houses
    }
    
    if include_aspects:
        aspects = calculate_aspects(planets)
        result["aspects"] = aspects
    
    return result
