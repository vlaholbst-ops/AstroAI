import redis
import sys

print("🔍 Подключаюсь к Redis...", flush=True)

try:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    
    # Проверка подключения
    r.ping()
    print("✅ Redis подключен!\n", flush=True)
    
    # Все ключи интерпретаций
    keys = r.keys("interpretation:*")
    print(f"📦 Найдено ключей в Redis: {len(keys)}\n", flush=True)
    
    if not keys:
        print("❌ Кэш пуст. Сделай запрос к /interpret-chart сначала!", flush=True)
        print("\nПример команды:", flush=True)
        print('curl.exe -X POST "http://127.0.0.1:8000/api/astrology/interpret-chart" -H "Content-Type: application/json" -d \'{\\"birth_date\\": \\"2000-01-01T12:00:00Z\\", \\"latitude\\": 55.7558, \\"longitude\\": 37.6173}\'', flush=True)
    else:
        for i, key in enumerate(keys, 1):
            ttl = r.ttl(key)
            value = r.get(key)
            value_preview = value[:200] if value else "None"
            
            print(f"🔑 Ключ #{i}: {key}", flush=True)
            print(f"⏱️  TTL: {ttl} сек (~{ttl//86400} дней, {(ttl % 86400)//3600} часов)", flush=True)
            print(f"📏 Размер: {len(value)} символов", flush=True)
            print(f"📄 Начало текста:\n{value_preview}...\n", flush=True)
            print("-" * 80, flush=True)
            
except redis.ConnectionError as e:
    print(f"❌ Ошибка подключения к Redis: {e}", flush=True)
    print("Проверь что Redis запущен: redis-server или Docker", flush=True)
except Exception as e:
    print(f"❌ Ошибка: {e}", flush=True)
