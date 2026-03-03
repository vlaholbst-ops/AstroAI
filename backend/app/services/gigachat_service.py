import hashlib
import httpx
import base64
import uuid
import json
import logging
import time
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Dict
from redis.asyncio import Redis
from datetime import timedelta
from app.core.config import settings

# ---------------------------------------------------------------------------
# Logger setup — JSON, один файл до 100MB, 5 архивов
# ---------------------------------------------------------------------------
_LOGS_DIR = Path(__file__).resolve().parent.parent.parent / "logs"
_LOGS_DIR.mkdir(exist_ok=True)

_logger = logging.getLogger("gigachat")
_logger.setLevel(logging.INFO)
_logger.propagate = False  # не дублировать в root-logger

if not _logger.handlers:
    _handler = RotatingFileHandler(
        _LOGS_DIR / "gigachat.log",
        maxBytes=100 * 1024 * 1024,  # 100 MB
        backupCount=5,
        encoding="utf-8",
    )
    _handler.setFormatter(logging.Formatter("%(message)s"))
    _logger.addHandler(_handler)


def _log(event: str, **fields) -> None:
    """Записать JSON-строку в лог."""
    entry = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "event": event,
        **fields,
    }
    _logger.info(json.dumps(entry, ensure_ascii=False))


# ---------------------------------------------------------------------------
# GigaChat API
# ---------------------------------------------------------------------------

async def get_gigachat_token() -> str:
    """Получить JWT токен для GigaChat API"""
    auth_token = settings.GIGACHAT_CLIENT_SECRET
    rq_uid = str(uuid.uuid4())

    print(f"🔑 Client ID: {settings.GIGACHAT_CLIENT_ID}")
    print(f"🔑 Auth Token (first 50): {auth_token[:50]}...")

    async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
        resp = await client.post(
            "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "RqUID": rq_uid,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"scope": "GIGACHAT_API_PERS"},
        )

        print(f"🔍 OAuth Status: {resp.status_code}")
        print(f"🔍 Response Body: {resp.text[:1000]}")

        if resp.status_code != 200:
            raise Exception(f"GigaChat OAuth failed: {resp.status_code} - {resp.text}")

        result = resp.json()
        return result["access_token"]


async def get_interpretation(chart_data: Dict, redis: Redis) -> str:
    """GigaChat интерпретация натальной карты"""
    chart_hash = hashlib.md5(str(chart_data).encode()).hexdigest()
    cache_key = f"interpretation:{chart_hash}"

    # --- cache hit ---
    t0 = time.monotonic()
    cached = await redis.get(cache_key)
    if cached:
        response_time_ms = round((time.monotonic() - t0) * 1000, 2)
        _log(
            "cache_hit",
            cache_key=cache_key,
            source="redis",
            response_time_ms=response_time_ms,
        )
        return cached.decode() if isinstance(cached, bytes) else cached

    sun = chart_data["planets"]["sun"]
    asc = chart_data["houses"]["ascendant"]
    aspects = chart_data.get("aspects", [])[:3]

    prompt = (
        "Ты профессиональный астролог. Проанализируй натальную карту (200-250 слов):\n\n"
        f"Солнце: {sun['degree']:.1f}° {sun['zodiac_sign']}\n"
        f"Асцендент: {asc['degree']:.1f}° {asc['zodiac_sign']}\n"
        f"Ключевые аспекты: {aspects}\n\n"
        "Дай персональный прогноз:\n"
        "- Характер и темперамент\n"
        "- Сильные стороны\n"
        "- Рекомендации для жизни\n\n"
        "Стиль: позитивный, вдохновляющий."
    )

    try:
        token = await get_gigachat_token()
    except Exception as e:
        print(f"❌ Token error: {e}")
        _log(
            "token_error",
            cache_key=cache_key,
            source="gigachat_api",
            error=str(e),
        )
        return f"Временная заглушка: Солнце в {sun['zodiac_sign']} указывает на сильную личность."

    # --- API call ---
    model_version = "GigaChat"
    t_api = time.monotonic()

    async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
        resp = await client.post(
            "https://gigachat.devices.sberbank.ru/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={
                "model": model_version,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 512,
            },
        )
        result = resp.json()

    response_time_ms = round((time.monotonic() - t_api) * 1000, 2)

    if "choices" not in result:
        print(f"❌ GigaChat API error: {result}")
        _log(
            "api_error",
            cache_key=cache_key,
            source="gigachat_api",
            model_version=model_version,
            response_time_ms=response_time_ms,
            error=str(result.get("error", result)),
        )
        return f"Ошибка GigaChat API: {result.get('error', result)}"

    interpretation = result["choices"][0]["message"]["content"]

    # token_count из поля usage (может отсутствовать)
    usage = result.get("usage", {})
    token_count = usage.get("total_tokens")

    # model из ответа (может уточниться, напр. "GigaChat:latest")
    returned_model = result.get("model", model_version)

    _log(
        "api_call",
        cache_key=cache_key,
        source="gigachat_api",
        model_version=returned_model,
        response_time_ms=response_time_ms,
        token_count=token_count,
        prompt_tokens=usage.get("prompt_tokens"),
        completion_tokens=usage.get("completion_tokens"),
    )

    await redis.setex(cache_key, int(timedelta(days=7).total_seconds()), interpretation)
    return interpretation
