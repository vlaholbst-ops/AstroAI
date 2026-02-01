from skyfield.api import Loader
from pathlib import Path

# Путь к папке ephemeris
EPHEMERIS_DIR = Path(__file__).parent / "ephemeris"

# Создаём загрузчик, который сохранит файлы в нашу папку
loader = Loader(str(EPHEMERIS_DIR))

print(f"📂 Папка для эфемерид: {EPHEMERIS_DIR}")
print("📥 Скачиваю эфемериды de421.bsp...")

# Skyfield сам скачает файл, если его нет
ts = loader.timescale()
eph = loader('de421.bsp')

print("✅ Эфемериды успешно скачаны!")
print(f"📁 Файл сохранён: {EPHEMERIS_DIR / 'de421.bsp'}")
print(f"📊 Размер: {(EPHEMERIS_DIR / 'de421.bsp').stat().st_size / 1024 / 1024:.2f} МБ")
