from app.core.astrology import calculate_sun_position

def print_test_header(title: str):
    print("=" * 60)
    print(title)
    print("=" * 60)


# Тест 1: Весеннее равноденствие 2024 (Солнце входит в Овен)
print_test_header("ТЕСТ 1: Весеннее равноденствие 2024 (ожидается конец Рыб / начало Овна)")

result1 = calculate_sun_position(
    birth_date="2024-03-20",
    birth_time="03:06:00",  # Время равноденствия (UTC, приблизительно)
    latitude=0.0,
    longitude=0.0,
)

print(f"Результат: {result1}")
print("Комментарий: вокруг этого момента Солнце переходит из 29° Рыб в 0° Овна.")
print()


# Тест 2: Летнее солнцестояние 2024 (Солнце в начале Рака)
print_test_header("ТЕСТ 2: Летнее солнцестояние 2024 (ожидается начало Рака)")

result2 = calculate_sun_position(
    birth_date="2024-06-20",
    birth_time="20:51:00",  # Время солнцестояния (UTC, приблизительно)
    latitude=0.0,
    longitude=0.0,
)

print(f"Результат: {result2}")
print()


# Тест 3: Произвольная дата (пример)
print_test_header("ТЕСТ 3: Произвольная дата (пример)")

result3 = calculate_sun_position(
    birth_date="1998-05-15",
    birth_time="12:00:00",
    latitude=55.7558,   # Москва
    longitude=37.6173,
)

print(f"Результат: {result3}")
print("Комментарий: 15 мая обычно даёт Солнце в Тельце.")
print()