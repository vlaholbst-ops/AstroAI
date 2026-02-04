from fastapi import APIRouter, HTTPException, Query, Depends
from app.schemas.natal_chart import (
    NatalChartRequest, 
    NatalChartResponse,
    NatalChartWithAspectsResponse
)
from app.services.astrology_service import get_natal_chart
from redis.asyncio import Redis
from app.db.redis import get_redis


# Создаём роутер
router = APIRouter()


@router.post("/calculate-chart", response_model=NatalChartResponse)
async def calculate_chart(request: NatalChartRequest):
    """
    Рассчитать натальную карту (планеты + дома).
    
    Args:
        request: NatalChartRequest с полями birth_date, latitude, longitude
    
    Returns:
        NatalChartResponse с планетами, домами, ASC, MC
    """
    try:
        chart = get_natal_chart(
            request.birth_date,
            request.latitude,
            request.longitude,
            include_aspects=False
        )
        return chart
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка расчёта натальной карты: {str(e)}"
        )


@router.post("/calculate-chart-full", response_model=NatalChartWithAspectsResponse)
async def calculate_chart_full(request: NatalChartRequest):
    """
    Рассчитать полную натальную карту (планеты + дома + аспекты).
    
    Args:
        request: NatalChartRequest с полями birth_date, latitude, longitude
    
    Returns:
        NatalChartWithAspectsResponse с планетами, домами, ASC, MC и аспектами
    """
    try:
        chart = get_natal_chart(
            request.birth_date,
            request.latitude,
            request.longitude,
            include_aspects=True
        )
        return chart
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка расчёта натальной карты: {str(e)}"
        )


@router.get("/health")
async def astrology_health():
    """Проверка работы модуля астрологии"""
    return {
        "status": "ok",
        "module": "astrology",
        "features": ["natal_chart", "planets", "houses", "aspects"]
    }


@router.post("/interpret-chart")
async def interpret_natal_chart(
    request: NatalChartRequest,
    redis: Redis = Depends(get_redis)
):
    """GigaChat интерпретация натальной карты"""
    from app.services.gigachat_service import get_interpretation
    
    chart = get_natal_chart(
        request.birth_date,
        request.latitude,
        request.longitude,
        include_aspects=True
    )
    
    interpretation = await get_interpretation(chart, redis)
    return {"interpretation": interpretation}
@router.get("/cache/stats")
async def cache_stats(redis: Redis = Depends(get_redis)):
    """Статистика Redis кэша"""
    keys = []
    async for key in redis.scan_iter("interpretation:*"):
        keys.append(key)
    
    stats = []
    for key in keys[:10]:  # Первые 10 ключей
        ttl = await redis.ttl(key)
        value = await redis.get(key)
        preview = (value.decode() if isinstance(value, bytes) else value)[:100] if value else "None"
        
        stats.append({
            "key": key.decode() if isinstance(key, bytes) else key,
            "ttl_seconds": ttl,
            "ttl_days": round(ttl / 86400, 1),
            "preview": preview
        })
    
    return {
        "total_keys": len(keys),
        "samples": stats
    }


@router.delete("/cache/clear")
async def clear_cache(redis: Redis = Depends(get_redis)):
    """Очистить весь кэш интерпретаций (админ)"""
    keys = []
    async for key in redis.scan_iter("interpretation:*"):
        keys.append(key)
    
    deleted_count = 0
    if keys:
        deleted_count = await redis.delete(*keys)
    
    return {
        "message": "Кэш очищен",
        "deleted_keys": deleted_count
    }


@router.delete("/cache/clear/{key_hash}")
async def clear_specific_cache(key_hash: str, redis: Redis = Depends(get_redis)):
    """Удалить конкретный ключ из кэша"""
    full_key = f"interpretation:{key_hash}"
    result = await redis.delete(full_key)
    
    if result:
        return {"message": f"Ключ {key_hash} удалён"}
    else:
        return {"message": f"Ключ {key_hash} не найден"}
