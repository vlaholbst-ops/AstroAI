import hashlib
import httpx
from typing import Dict
from redis.asyncio import Redis
from datetime import timedelta
from app.core.config import settings

async def get_interpretation(chart_data: Dict, redis: Redis) -> str:
    """DeepSeek интерпретация натальной карты"""
    chart_hash = hashlib.md5(str(chart_data).encode()).hexdigest()
    cache_key = f"interpretation:{chart_hash}"
    
    cached = await redis.get(cache_key)
    if cached:
        return cached
    
    sun = chart_data["planets"]["sun"]
    asc = chart_data["houses"]["ascendant"]
    aspects = chart_data.get("aspects", [])[:3]
    
    prompt = f"""Ты астролог AstroAI. Натальная карта (200 слов, русский):

Солнце: {sun["degree"]:.1f}° {sun["zodiac_sign"]}
Асцендент: {asc["degree"]:.1f}° {asc["zodiac_sign"]}
Топ-аспекты: {aspects}

Дай персональный прогноз: характер, рекомендации."""
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}"},
            json={
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 500
            }
        )
        result = resp.json()
        
        if "choices" not in result:
            print(f"❌ DeepSeek API error: {result}")
            return f"Ошибка DeepSeek API: {result.get('error', result)}"
        
        interpretation = result["choices"][0]["message"]["content"]
    
    await redis.setex(cache_key, int(timedelta(days=7).total_seconds()), interpretation)
    return interpretation
