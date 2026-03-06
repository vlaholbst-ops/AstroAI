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
EPHEMERIS_DIR = Path(__file__).resolve().parent.parent.parent / "ephemeris"
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
    
    # Получаем эклиптическую долготу в тропическом зодиаке (epoch='date')
    # ВАЖНО: без epoch='date' возвращаются координаты J2000.0, что даёт
    # систематическую ошибку ~1.4° для 1900 г. и ~0.36° для 2026 г.
    lat_ecliptic, lon_ecliptic, distance_ecliptic = astrometric.apparent().ecliptic_latlon(epoch='date')
    
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

def calculate_aspects(chart: dict, orb_conjunction: float = 8.0, orb_major: float = 8.0, orb_minor: float = 6.0) -> list:
    """
    Рассчитывает аспекты между планетами.
    
    Args:
        chart: Натальная карта (результат calculate_natal_chart)
        orb_conjunction: Орбис для соединения (градусы)
        orb_major: Орбис для мажорных аспектов (оппозиция, тригон)
        orb_minor: Орбис для минорных аспектов (квадрат, секстиль)
    
    Returns:
        list аспектов: [{planet1, planet2, aspect_type, angle, orb, is_applying}]
    """
    aspects = []
    
    # Определение типов аспектов и их орбисов
    aspect_definitions = {
        'Соединение': {'angle': 0, 'orb': orb_conjunction, 'symbol': '☌'},
        'Оппозиция': {'angle': 180, 'orb': orb_major, 'symbol': '☍'},
        'Тригон': {'angle': 120, 'orb': orb_major, 'symbol': '△'},
        'Квадрат': {'angle': 90, 'orb': orb_minor, 'symbol': '□'},
        'Секстиль': {'angle': 60, 'orb': orb_minor, 'symbol': '⚹'}
    }
    
    # Получаем список планет
    planets = list(chart.keys())
    
    # Проверяем все пары планет
    for i in range(len(planets)):
        for j in range(i + 1, len(planets)):
            planet1 = planets[i]
            planet2 = planets[j]
            
            # Получаем долготы планет
            lon1 = chart[planet1]['longitude']
            lon2 = chart[planet2]['longitude']
            
            # Вычисляем угловое расстояние (всегда берём меньший угол)
            diff = abs(lon1 - lon2)
            if diff > 180:
                diff = 360 - diff
            
            # Проверяем каждый тип аспекта
            for aspect_name, aspect_info in aspect_definitions.items():
                target_angle = aspect_info['angle']
                allowed_orb = aspect_info['orb']
                
                # Вычисляем отклонение от точного аспекта
                orb = abs(diff - target_angle)
                
                # Если попадаем в орбис — аспект найден
                if orb <= allowed_orb:
                    aspects.append({
                        'planet1': chart[planet1]['planet'],
                        'planet2': chart[planet2]['planet'],
                        'aspect_type': aspect_name,
                        'aspect_symbol': aspect_info['symbol'],
                        'angle': round(diff, 2),
                        'exact_angle': target_angle,
                        'orb': round(orb, 2),
                        'planet1_position': f"{chart[planet1]['degree']:.2f}° {chart[planet1]['zodiac_sign']}",
                        'planet2_position': f"{chart[planet2]['degree']:.2f}° {chart[planet2]['zodiac_sign']}"
                    })
                    break  # Планета может иметь только один аспект с другой планетой
    
    # Сортируем аспекты по силе (меньший орбис = сильнее аспект)
    aspects.sort(key=lambda x: x['orb'])
    
    return aspects
def calculate_sun_position(birth_date: str, birth_time: str, latitude: float, longitude: float) -> dict:
    """
    Рассчитывает позицию Солнца (совместимость со старым API).
    
    Args:
        birth_date: 'YYYY-MM-DD' (UTC)
        birth_time: 'HH:MM:SS' (UTC)
        latitude: -90..90
        longitude: -180..180
        
    Returns:
        {"sign": "Aries", "degree": 5.23, "ecliptic_longitude": 5.23}
    """
    from datetime import datetime, timezone
    
    # Парсим дату/время
    dt_str = f"{birth_date} {birth_time}"
    birth_dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
    
    # Берём из calculate_natal_chart только Солнце
    chart = calculate_natal_chart(birth_dt, latitude, longitude)
    sun_data = chart["sun"]
    
    return {
        "sign": sun_data["zodiac_sign"],
        "degree": sun_data["degree"],
        "ecliptic_longitude": sun_data["longitude"]
    }

if __name__ == "__main__":
    # Пример: Москва, 1 января 2000, 12:00 UTC
    test_dt = datetime(2000, 1, 1, 12, 0, tzinfo=timezone.utc)
    test_lat = 55.7558  # Москва
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
    
    # Аспекты
    print("\n" + "="*50 + "\n")
    print("⚡ АСПЕКТЫ:\n")
    aspects = calculate_aspects(chart)
    
    if aspects:
        for asp in aspects:
            print(f"{asp['planet1']:10} {asp['aspect_symbol']} {asp['planet2']:10} | "
                  f"{asp['aspect_type']:12} | Угол: {asp['angle']:6.2f}° | Орбис: {asp['orb']:5.2f}°")
    else:
        print("Аспекты не найдены")


