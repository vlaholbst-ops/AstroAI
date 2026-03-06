# AstroAI — Database Schema

PostgreSQL 15. Все PK — `UUID v4`. Все timestamps — `TIMESTAMPTZ` (UTC).

---

## Таблицы

### users

Зарегистрированные пользователи приложения.

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | `UUID` | PK | Уникальный идентификатор |
| `email` | `VARCHAR(255)` | UNIQUE NOT NULL, IDX | Email (логин) |
| `username` | `VARCHAR(100)` | UNIQUE, IDX | Отображаемое имя |
| `password_hash` | `VARCHAR(255)` | — | Bcrypt-хеш пароля |
| `is_active` | `BOOLEAN` | NOT NULL DEFAULT true | Флаг активности аккаунта |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | Дата регистрации |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | Дата последнего изменения |

**Индексы:** `ix_users_email` (UNIQUE), `ix_users_username`

---

### subscriptions

Подписки пользователей. Связь 1:1 с `users`.

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | `UUID` | PK | Уникальный идентификатор |
| `user_id` | `UUID` | FK→users.id CASCADE, UNIQUE | Владелец подписки |
| `plan` | `ENUM` | NOT NULL DEFAULT free | `free` / `basic` / `premium` |
| `status` | `ENUM` | NOT NULL DEFAULT active | `active` / `cancelled` / `expired` |
| `started_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | Дата начала |
| `expires_at` | `TIMESTAMPTZ` | — | Дата окончания (NULL = бессрочно) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | Дата создания записи |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | Дата изменения |

**Индексы:** `ix_subscriptions_user_id` (UNIQUE)
**ON DELETE:** `CASCADE` — при удалении пользователя подписка удаляется

---

### natal_charts

Натальные карты. Привязка к пользователю необязательна — карты могут рассчитываться анонимно.

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | `UUID` | PK | Уникальный идентификатор |
| `user_id` | `UUID` | FK→users.id SET NULL, IDX | Владелец (NULL = анонимный расчёт) |
| `birth_date` | `TIMESTAMPTZ` | NOT NULL, IDX | Дата/время рождения (UTC) |
| `latitude` | `FLOAT` | NOT NULL | Широта места рождения |
| `longitude` | `FLOAT` | NOT NULL | Долгота места рождения |
| `location_name` | `VARCHAR(255)` | — | Название места (из Nominatim) |
| `planets_data` | `JSONB` | NOT NULL | Позиции планет (результат API) |
| `houses_data` | `JSONB` | NOT NULL | Дома + ASC/MC |
| `aspects_data` | `JSONB` | — | Аспекты (может отсутствовать) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | Дата расчёта |

**Индексы:** `ix_natal_charts_user_id`, `ix_natal_charts_birth_date`,
`ix_natal_charts_user_id_birth_date` (составной)
**ON DELETE:** `SET NULL` — при удалении пользователя карта сохраняется

---

### ai_interpretations

AI-интерпретации натальных карт от GigaChat. Кэшируются по `prompt_hash` (дублирует Redis TTL 7 дней).

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | `UUID` | PK | Уникальный идентификатор |
| `natal_chart_id` | `UUID` | FK→natal_charts.id CASCADE, IDX | Карта, для которой сделана интерпретация |
| `prompt_hash` | `VARCHAR(32)` | NOT NULL, IDX | MD5(birth_date + lat + lon) — ключ кэша |
| `interpretation_text` | `TEXT` | NOT NULL | Текст ответа GigaChat |
| `model_version` | `VARCHAR(50)` | — | Версия модели (GigaChat-Pro и т.д.) |
| `token_count` | `INTEGER` | — | Суммарное количество токенов |
| `response_time_ms` | `INTEGER` | — | Время ответа API (мс) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | Дата создания |

**Индексы:** `ix_ai_interpretations_natal_chart_id`, `ix_ai_interpretations_prompt_hash`
**ON DELETE:** `CASCADE` — при удалении карты удаляются все интерпретации

---

## ER-диаграмма

Файл: [`er_diagram.drawio`](er_diagram.drawio)

Для экспорта в PNG:
```bash
# Вариант 1: draw.io CLI (если установлен)
drawio --export --format png --output er_diagram.png er_diagram.drawio

# Вариант 2: открыть в draw.io Desktop / app.diagrams.net → File → Export As → PNG
```

---

## Связи

```
users ──────────────── subscriptions
  │   1:1 (CASCADE)
  │
  └───────────────────  natal_charts
        1:N (SET NULL)
             │
             └──────── ai_interpretations
                   1:N (CASCADE)
```

---

## Миграции (Alembic)

```bash
cd backend
source venv/bin/activate

# Применить все миграции
alembic upgrade head

# Откатить на одну версию
alembic downgrade -1

# Посмотреть статус
alembic current
alembic history

# Создать новую миграцию (после изменения моделей)
alembic revision --autogenerate -m "описание изменений"
```

Файлы миграций: `backend/alembic/versions/`

---

## DDL (raw SQL)

```sql
-- Enums
CREATE TYPE subscriptionplan AS ENUM ('free', 'basic', 'premium');
CREATE TYPE subscriptionstatus AS ENUM ('active', 'cancelled', 'expired');

-- users
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    username    VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ix_users_email    ON users (email);
CREATE        INDEX ix_users_username ON users (username);

-- subscriptions
CREATE TABLE subscriptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan        subscriptionplan NOT NULL DEFAULT 'free',
    status      subscriptionstatus NOT NULL DEFAULT 'active',
    started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ix_subscriptions_user_id ON subscriptions (user_id);

-- natal_charts
CREATE TABLE natal_charts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    birth_date    TIMESTAMPTZ NOT NULL,
    latitude      FLOAT NOT NULL,
    longitude     FLOAT NOT NULL,
    location_name VARCHAR(255),
    planets_data  JSONB NOT NULL,
    houses_data   JSONB NOT NULL,
    aspects_data  JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_natal_charts_user_id             ON natal_charts (user_id);
CREATE INDEX ix_natal_charts_birth_date          ON natal_charts (birth_date);
CREATE INDEX ix_natal_charts_user_id_birth_date  ON natal_charts (user_id, birth_date);

-- ai_interpretations
CREATE TABLE ai_interpretations (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    natal_chart_id       UUID NOT NULL REFERENCES natal_charts(id) ON DELETE CASCADE,
    prompt_hash          VARCHAR(32) NOT NULL,
    interpretation_text  TEXT NOT NULL,
    model_version        VARCHAR(50),
    token_count          INTEGER,
    response_time_ms     INTEGER,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_ai_interpretations_natal_chart_id ON ai_interpretations (natal_chart_id);
CREATE INDEX ix_ai_interpretations_prompt_hash    ON ai_interpretations (prompt_hash);
```
