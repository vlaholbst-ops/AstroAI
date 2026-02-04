import hashlib
import httpx
import base64
import uuid
from typing import Dict
from redis.asyncio import Redis
from datetime import timedelta
from app.core.config import settings

async def get_gigachat_token() -> str:
    """Получить JWT токен для GigaChat API"""
    # Authorization Key УЖЕ в base64 формате!
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
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data={"scope": "GIGACHAT_API_PERS"}
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
    
    cached = await redis.get(cache_key)
    if cached:
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
        return f"Временная заглушка: Солнце в {sun['zodiac_sign']} указывает на сильную личность."
    
    async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
        resp = await client.post(
            "https://gigachat.devices.sberbank.ru/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={
                "model": "GigaChat",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 512
            }
        )
        result = resp.json()
        
        if "choices" not in result:
            print(f"❌ GigaChat API error: {result}")
            return f"Ошибка GigaChat API: {result.get('error', result)}"
        
        interpretation = result["choices"][0]["message"]["content"]
    
    await redis.setex(cache_key, int(timedelta(days=7).total_seconds()), interpretation)
    return interpretation