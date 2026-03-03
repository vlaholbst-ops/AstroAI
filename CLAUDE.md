# AstroAI

Мобильное приложение (iOS/Android): натальная карта по дате/времени/месту рождения → AI-интерпретация через GigaChat. Монорепо: Python FastAPI backend + React Native Expo frontend.

## Commands

### Backend
```bash
cd backend
source venv/bin/activate        # Mac/Linux
.\venv\Scripts\Activate.ps1     # Windows
uvicorn app.main:app --reload   # Dev server → http://127.0.0.1:8000
docker-compose up -d postgres redis  # Инфраструктура
pytest tests/                   # Тесты
```

### Frontend
```bash
cd mobile
npm install
npm start          # Metro bundler
npm run ios        # iOS Simulator
npm run android    # Android Emulator
npm run web        # Web → localhost:19006
```

## Architecture

```
backend/
├── app/
│   ├── core/config.py              # Settings, env vars
│   ├── db/session.py               # PostgreSQL + Redis connections
│   ├── models/                     # SQLAlchemy models
│   ├── routers/astrology.py        # API endpoints
│   ├── schemas/natal_chart.py      # Pydantic request/response
│   └── services/
│       ├── astrology_calculator.py # ★ ВСЕ расчёты здесь (единственный источник)
│       ├── astrology_service.py    # Обёртка для API
│       └── gigachat_service.py     # ★ GigaChat AI интерпретация
├── ephemeris/de421.bsp             # NASA эфемериды (НЕ в Git, ~17MB)
├── tests/
├── requirements.txt
└── docker-compose.yml

mobile/
├── src/
│   ├── components/                 # BirthDatePicker, LocationAutocomplete, SubmitButton
│   ├── screens/InputScreen.tsx     # Основной экран ввода
│   ├── services/
│   │   ├── astrologyApi.ts         # Backend API client
│   │   └── nominatimApi.ts         # Geocoding (OpenStreetMap)
│   ├── store/
│   │   ├── store.ts                # Redux Store
│   │   └── slices/                 # formSlice, chartSlice
│   ├── types/chart.types.ts        # TypeScript interfaces
│   └── config.ts                   # API URLs
└── package.json
```

## API Endpoints

| Method | Endpoint | Описание |
|--------|----------|----------|
| POST | `/api/astrology/calculate-chart` | Планеты + дома |
| POST | `/api/astrology/calculate-chart-full` | + аспекты |
| POST | `/api/astrology/interpret-chart` | + AI-интерпретация (GigaChat) |
| GET | `/api/astrology/health` | Health check |
| GET | `/api/astrology/cache/stats` | Redis статистика |
| DELETE | `/api/astrology/cache/clear` | Очистить кэш |

Request body: `{"birth_date": "2000-01-01T09:00:00.000Z", "latitude": 55.7558, "longitude": 37.6173}`

Swagger UI: http://127.0.0.1:8000/docs

## Critical Rules

### Backend
- **Единственный источник расчётов** — `app/services/astrology_calculator.py`. Файл `app/core/astrology.py` удалён, НЕ создавать заново.
- **AI-провайдер — GigaChat (Сбер)**, не DeepSeek. Импорт: `from app.services.gigachat_service import get_interpretation`
- **Python 3.13: многострочные f-strings нестабильны.** Использовать конкатенацию:
  ```python
  # ✅
  prompt = (
      "Текст\n"
      f"Переменная: {value}\n"
      "Ещё текст"
  )
  # ❌ Может сломаться
  prompt = f"""Текст
  {value}
  Ещё текст"""
  ```
- **Все расчёты в UTC.** Конвертация timezone — ответственность frontend.
- **Эфемериды** — `de421.bsp` в `/backend/ephemeris/`. Путь вычисляется в `astrology_calculator.py` относительно файла. НЕ коммитить в Git.
- **Redis кэш интерпретаций** — ключ `interpretation:{MD5(chart_data)}`, TTL 7 дней.
- **GigaChat OAuth** — токен НЕ кэшируется, каждый запрос = новый токен. Кэшируется только результат интерпретации.

### Frontend
- **Date в Redux не сериализуется** — уже настроено: `serializableCheck.ignoredPaths: ['form.birthdate']`. Не ломать.
- **Nominatim API требует User-Agent header** `'AstroAI/1.0'`, иначе 403.
- **Alert.alert() не работает на Web** — использовать `Platform.OS === 'web' ? alert() : Alert.alert()`.
- **Не использовать AbortSignal.timeout()** — не поддерживается на iOS.
- **FlatList внутри ScrollView** — использовать `.map()` вместо FlatList.

### Git
- НЕ коммитить: `.env`, `ephemeris/`, `node_modules/`, `venv/`
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

## Tech Stack

**Backend:** Python 3.13, FastAPI 0.115, Skyfield 1.49, PySwisseph 2.10, PostgreSQL 15, Redis 7, GigaChat API, httpx, SQLAlchemy async, Pydantic 2.10

**Frontend:** React Native 0.81.5, Expo 54, TypeScript 5.9, Redux Toolkit 2.11, date-fns + date-fns-tz, lodash.debounce

## Environment (.env)

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=astroai_user
POSTGRES_PASSWORD=astroai_password_dev
POSTGRES_DB=astroai_db
REDIS_HOST=localhost
REDIS_PORT=6379
GIGACHAT_CLIENT_ID=<uuid>
GIGACHAT_CLIENT_SECRET=<base64 key>
ENVIRONMENT=development
DEBUG=True
SECRET_KEY=<change in production>
```

## Current Status (March 2026)

- ✅ Backend API готов (натальная карта, аспекты, GigaChat, кэш)
- 🔄 Frontend: экран ввода готов, экран результатов и AI-чат в разработке
- 🔄 Медийка: пивот на автоматизацию видео (Reels/Shorts)
- 🎯 MVP цель: Апрель 2026 — end-to-end flow + 10-20 тестовых пользователей
