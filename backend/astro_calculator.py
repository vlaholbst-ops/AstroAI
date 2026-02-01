"""
Модуль для астрологических расчётов позиций планет и домов.
Использует Skyfield для точных астрономических данных.
"""

from skyfield.api import Loader, Topos
from skyfield.almanac import find_discrete, risings_and_settings
from pathlib import Path
from datetime import datetime, timezone
import math
import swisseph as swe


# Константы
EPHEMERIS_DIR = Path(__file__).parent / "ephemeris"
ZODIAC_SIGNS = [
    "Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева",
    "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"
]

# Инициализация Skyfield Loader
loader = Loader(str(EPHEMERIS_DIR))
ts = loader.timescale()
eph = loader('de421.bsp')


def calculate_planet_position(planet_name: str, dt: datetime, lat: float, lon: float) -> dict:
    """
    Рассчитывает позицию планеты в натальной карте.
    
    Args:
        planet_name: Название планеты ('sun', 'moon', 'mercury', и т.д.)
        dt: Дата и время рождения (UTC или с timezone)
        lat: Широта места рождения (градусы)
        lon: Долгота места рождения (градусы)
    
    Returns:
        dict с ключами: planet, zodiac_sign, degree, retrograde
    """
    # Преобразуем datetime в Skyfield Time
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    t = ts.from_datetime(dt)
    
    # Позиция наблюдателя
    location = eph['earth'] + Topos(latitude_degrees=lat, longitude_degrees=lon)
    
    # Получаем планету из эфемерид
    planet_map = {
        'sun': 'sun',
        'moon': 'moon',
        'mercury': 'mercury',
        'venus': 'venus',
        'mars': 'mars',
        'jupiter': 'jupiter barycenter',
        'saturn': 'saturn barycenter',
        'uranus': 'uranus barycenter',
        'neptune': 'neptune barycenter',
        'pluto': 'pluto barycenter'
    }
    
    planet_body = eph[planet_map[planet_name.lower()]]
    
    # Рассчитываем положение планеты относительно наблюдателя
    astrometric = location.at(t).observe(planet_body)
    ra, dec, distance = astrometric.radec()
    
    # Получаем эклиптическую долготу (зодиакальную позицию)
    lat_ecliptic, lon_ecliptic, distance_ecliptic = astrometric.ecliptic_latlon()
    
    # Преобразуем долготу в градусы (0-360)
    longitude_deg = lon_ecliptic.degrees % 360
    
    # Определяем знак зодиака и градус в знаке
    sign_index = int(longitude_deg // 30)
    degree_in_sign = longitude_deg % 30
    
    # TODO: Определение ретроградности (требует расчёта скорости)
    is_retrograde = False
    
    return {
        'planet': planet_name.capitalize(),
        'zodiac_sign': ZODIAC_SIGNS[sign_index],
        'degree': round(degree_in_sign, 2),
        'longitude': round(longitude_deg, 2),
        'retrograde': is_retrograde
    }


def calculate_natal_chart(birth_dt: datetime, lat: float, lon: float) -> dict:
    """
    Рассчитывает полную натальную карту (позиции всех планет).
    
    Args:
        birth_dt: Дата и время рождения
        lat: Широта
        lon: Долгота
    
    Returns:
        dict с позициями планет
    """
    planets = ['sun', 'moon', 'mercury', 'venus', 'mars', 
               'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']
    
    chart = {}
    for planet in planets:
        chart[planet] = calculate_planet_position(planet, birth_dt, lat, lon)
    
    return chart


def calculate_houses(birth_dt: datetime, lat: float, lon: float, house_system='P') -> dict:
    """
    Рассчитывает астрологические дома по системе Placidus.
    
    Args:
        birth_dt: Дата и время рождения
        lat: Широта
        lon: Долгота
        house_system: Система домов ('P' = Placidus, 'K' = Koch, 'E' = Equal)
    
    Returns:
        dict с ключами: ascendant, mc, houses (список 12 домов)
    """
    if birth_dt.tzinfo is None:
        birth_dt = birth_dt.replace(tzinfo=timezone.utc)
    
    # Конвертируем в Julian Day (формат Swiss Ephemeris)
    jd = swe.julday(
        birth_dt.year, 
        birth_dt.month, 
        birth_dt.day,
        birth_dt.hour + birth_dt.minute / 60.0 + birth_dt.second / 3600.0
    )
    
    # Рассчитываем дома
    cusps, ascmc = swe.houses(jd, lat, lon, house_system.encode('ascii'))
    
    houses_list = []
    # cusps имеет 12 элементов (индексы 0-11), каждый - куспид дома
    for i in range(12):
        cusp_longitude = cusps[i]
        sign_index = int(cusp_longitude // 30)
        degree_in_sign = cusp_longitude % 30
        
        houses_list.append({
            'house': i + 1,  # Дома нумеруются с 1
            'zodiac_sign': ZODIAC_SIGNS[sign_index],
            'degree': round(degree_in_sign, 2),
            'longitude': round(cusp_longitude, 2)
        })
    
    # ascmc[0] - Асцендент, ascmc[1] - MC
    asc_longitude = ascmc[0]
    mc_longitude = ascmc[1]
    
    return {
        'ascendant': {
            'zodiac_sign': ZODIAC_SIGNS[int(asc_longitude // 30)],
            'degree': round(asc_longitude % 30, 2),
            'longitude': round(asc_longitude, 2)
        },
        'mc': {
            'zodiac_sign': ZODIAC_SIGNS[int(mc_longitude // 30)],
            'degree': round(mc_longitude % 30, 2),
            'longitude': round(mc_longitude, 2)
        },
        'houses': houses_list
    }


# Тестовый запуск (если файл запущен напрямую)
if __name__ == "__main__":
    # Пример: Москва, 1 января 2000, 12:00 UTC
    test_dt = datetime(1998, 5, 9, 9, 30, tzinfo=timezone.utc)
    test_lat = 47.225918   # Москва
    test_lon = 37.6173
    
    print("🌍 Тестовый расчёт натальной карты")
    print(f"📅 Дата: {test_dt}")
    print(f"📍 Место: Москва ({test_lat}, {test_lon})")
    print("\n" + "="*50 + "\n")
    
    # Планеты
    print("🪐 ПЛАНЕТЫ:\n")
    chart = calculate_natal_chart(test_dt, test_lat, test_lon)
    for planet, data in chart.items():
        print(f"{data['planet']:10} | {data['zodiac_sign']:12} | {data['degree']:6.2f}° | Долгота: {data['longitude']:6.2f}°")
    
    # Дома
    print("\n" + "="*50 + "\n")
    print("🏠 ДОМА (система Placidus):\n")
    houses = calculate_houses(test_dt, test_lat, test_lon)
    
    print(f"ASC (Асцендент)    | {houses['ascendant']['zodiac_sign']:12} | {houses['ascendant']['degree']:6.2f}°")
    print(f"MC (Середина Неба) | {houses['mc']['zodiac_sign']:12} | {houses['mc']['degree']:6.2f}°")
    print()
    
    for house in houses['houses']:
        print(f"Дом {house['house']:2} | {house['zodiac_sign']:12} | {house['degree']:6.2f}°")
