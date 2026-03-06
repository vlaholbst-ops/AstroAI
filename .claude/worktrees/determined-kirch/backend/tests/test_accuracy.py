"""
TSK-58: Тестирование точности расчётов планет и домов.

Сравниваем calculate_planet_position() (Skyfield) с Swiss Ephemeris (эталон).
Swiss Ephemeris — тот же движок, что используют astro.com и astro-seek.com.

Допуски:
  - Планеты: ±1.0°
  - ASC/MC:  ±0.5° (calculate_houses() уже использует swe.houses() напрямую)
"""

import pytest
import swisseph as swe
from datetime import datetime, timezone

from app.services.astrology_calculator import calculate_planet_position, calculate_houses


# ─────────────────────────────── вспомогательные функции ───────────────────────────────

def angular_diff(a: float, b: float) -> float:
    """Минимальный угол между двумя эклиптическими долготами (0–360°)."""
    diff = abs(a - b) % 360
    return min(diff, 360 - diff)


def swe_planet_lon(jd: float, swe_id: int, lat: float, lon: float) -> float:
    """
    Топоцентрическая тропическая эклиптическая долгота из Swiss Ephemeris.
    Используется как эталон для сравнения с результатами Skyfield.
    """
    swe.set_topo(lon, lat, 0)  # порядок: geolon, geolat, geoalt(м)
    flags = swe.FLG_SWIEPH | swe.FLG_TOPOCTR
    result, _ = swe.calc_ut(jd, swe_id, flags)
    return result[0] % 360


# ───────────────────────────── параметры тестов ─────────────────────────────

# 21 дата: охват 1900–2026 (year, month, day, hour, minute, lat, lon, label)
TEST_DATES = [
    (1900,  1,  1, 12,  0,  51.5074,  -0.1278, "London 1900-01-01"),
    (1905,  5, 15,  8,  0,  48.8566,   2.3522, "Paris 1905-05-15"),
    (1917, 11,  7,  9,  0,  59.9343,  30.3351, "Petrograd 1917-11-07"),
    (1930,  6, 21, 12,  0,  40.7128, -74.0060, "NewYork 1930-06-21"),
    (1940,  9,  1,  6,  0,  52.5200,  13.4050, "Berlin 1940-09-01"),
    (1945,  5,  8, 15,  0,  52.5200,  13.4050, "Berlin 1945-05-08"),
    (1950,  1, 15,  0,  0,  55.7558,  37.6173, "Moscow 1950-01-15"),
    (1961,  4, 12,  6,  7,  45.6,     63.3,    "Baikonur 1961-04-12"),
    (1969,  7, 20, 20, 17,  28.5,    -80.6,    "Kennedy 1969-07-20"),
    (1975,  3, 20, 10,  0,  55.7558,  37.6173, "Moscow 1975-03-20"),
    (1980,  6, 21,  0,  0,  40.7128, -74.0060, "NewYork 1980-06-21"),
    (1989, 11,  9, 18,  0,  52.5200,  13.4050, "Berlin 1989-11-09"),
    (2000,  1,  1,  0,  0,   0.0,      0.0,    "Greenwich 2000-01-01"),
    (2000,  3, 20,  7, 35,   0.0,      0.0,    "SpringEq 2000-03-20"),
    (2005, 11, 11, 11, 11,  55.7558,  37.6173, "Moscow 2005-11-11"),
    (2010,  8, 15, 10,  0, -33.8688, 151.2093, "Sydney 2010-08-15"),
    (2017,  8, 21, 17, 26,  38.9072, -77.0369, "SolarEclipse 2017-08-21"),
    (2020, 12, 21, 18, 17,  48.8566,   2.3522, "Paris 2020-12-21"),
    (2022,  9, 23,  1,  4,  55.7558,  37.6173, "Moscow 2022-09-23"),
    (2024,  3, 20,  3,  6,   0.0,      0.0,    "SpringEq 2024-03-20"),
    (2026,  1,  1, 12,  0,  55.7558,  37.6173, "Moscow 2026-01-01"),
]

# (skyfield_name, swe_constant)
PLANET_PAIRS = [
    ("sun",     swe.SUN),
    ("moon",    swe.MOON),
    ("mercury", swe.MERCURY),
    ("venus",   swe.VENUS),
    ("mars",    swe.MARS),
    ("jupiter", swe.JUPITER),
    ("saturn",  swe.SATURN),
    ("uranus",  swe.URANUS),
    ("neptune", swe.NEPTUNE),
    ("pluto",   swe.PLUTO),
]

PLANET_TOLERANCE = 1.0   # градусов
ASC_MC_TOLERANCE = 0.5   # градусов


# ─────────────────────────────── тест планет ───────────────────────────────

@pytest.mark.parametrize("year,month,day,hour,minute,lat,lon,label", TEST_DATES)
@pytest.mark.parametrize("planet_name,swe_id", PLANET_PAIRS)
def test_planet_accuracy(
    planet_name, swe_id,
    year, month, day, hour, minute, lat, lon, label,
    comparison_recorder,
):
    """Точность Skyfield vs Swiss Ephemeris для каждой планеты на 21 дате."""
    dt = datetime(year, month, day, hour, minute, tzinfo=timezone.utc)
    jd = swe.julday(year, month, day, hour + minute / 60.0)

    # Наш калькулятор (Skyfield)
    result = calculate_planet_position(planet_name, dt, lat, lon)
    skyfield_lon = result["longitude"]

    # Эталон: Swiss Ephemeris (топоцентрический тропический)
    ref_lon = swe_planet_lon(jd, swe_id, lat, lon)

    delta = angular_diff(skyfield_lon, ref_lon)
    passed = delta <= PLANET_TOLERANCE

    comparison_recorder.append({
        "date": label,
        "planet": planet_name.capitalize(),
        "skyfield": round(skyfield_lon, 3),
        "swe": round(ref_lon, 3),
        "delta": round(delta, 3),
        "passed": passed,
    })

    assert passed, (
        f"{planet_name.capitalize()} на {label}: "
        f"Skyfield={skyfield_lon:.3f}° SwissEph={ref_lon:.3f}° "
        f"Δ={delta:.3f}° (допуск ±{PLANET_TOLERANCE}°)"
    )


# ─────────────────────────────── тест ASC/MC ───────────────────────────────

@pytest.mark.parametrize("year,month,day,hour,minute,lat,lon,label", TEST_DATES)
def test_asc_mc_accuracy(
    year, month, day, hour, minute, lat, lon, label,
    comparison_recorder,
):
    """
    ASC/MC из calculate_houses() должны совпадать с swe.houses() эталоном.
    calculate_houses() уже использует swe.houses() напрямую, ошибка должна быть ~0.
    """
    dt = datetime(year, month, day, hour, minute, tzinfo=timezone.utc)
    jd = swe.julday(year, month, day, hour + minute / 60.0)

    # Наш калькулятор
    houses = calculate_houses(dt, lat, lon)
    asc_lon = houses["ascendant"]["longitude"]
    mc_lon = houses["mc"]["longitude"]

    # Эталон: те же swe.houses() (должно совпадать идеально)
    cusps_ref, ascmc_ref = swe.houses(jd, lat, lon, b"P")
    ref_asc = ascmc_ref[0] % 360
    ref_mc = ascmc_ref[1] % 360

    delta_asc = angular_diff(asc_lon, ref_asc)
    delta_mc = angular_diff(mc_lon, ref_mc)

    for point, our_lon, ref_val, delta in [
        ("ASC", asc_lon, ref_asc, delta_asc),
        ("MC",  mc_lon,  ref_mc,  delta_mc),
    ]:
        comparison_recorder.append({
            "date": label,
            "planet": point,
            "skyfield": round(our_lon, 3),
            "swe": round(ref_val, 3),
            "delta": round(delta, 3),
            "passed": delta <= ASC_MC_TOLERANCE,
        })

    assert delta_asc <= ASC_MC_TOLERANCE, (
        f"ASC на {label}: calc={asc_lon:.3f}° ref={ref_asc:.3f}° Δ={delta_asc:.3f}°"
    )
    assert delta_mc <= ASC_MC_TOLERANCE, (
        f"MC на {label}: calc={mc_lon:.3f}° ref={ref_mc:.3f}° Δ={delta_mc:.3f}°"
    )
