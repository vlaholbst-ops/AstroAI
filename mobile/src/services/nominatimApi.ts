// src/services/nominatimApi.ts
import type { NominatimResult } from '../types/chart.types';
import { NOMINATIM_CONFIG } from '../config';

/**
 * Поиск города через Nominatim API (OpenStreetMap)
 * @param query - Название города (минимум 3 символа)
 * @returns Массив результатов (top 5)
 */
export const searchLocation = async (query: string): Promise<NominatimResult[]> => {
  // Минимальная длина запроса (защита от спама API)
  if (query.length < 3) {
    return [];
  }

  try {
    const url = new URL(`${NOMINATIM_CONFIG.BASE_URL}/search`);
    url.searchParams.append('q', query);
    url.searchParams.append('format', 'json');
    url.searchParams.append('limit', '5');
    url.searchParams.append('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': NOMINATIM_CONFIG.USER_AGENT, // ОБЯЗАТЕЛЬНО для Nominatim
      },
      signal: AbortSignal.timeout(5000), // 5 секунд timeout
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    return data as NominatimResult[];
  } catch (error) {
    console.error('Geocoding failed:', error);
    return [];
  }
};

/**
 * Форматирование результата для отображения пользователю
 * @param result - Результат от Nominatim API
 * @returns "Город, Страна (координаты)"
 */
export const formatLocationName = (result: NominatimResult): string => {
  const { display_name, lat, lon } = result;
  
  // Сокращённое название (первые 2 части: "Москва, Россия")
  const shortName = display_name.split(',').slice(0, 2).join(',').trim();
  
  return `${shortName} (${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)})`;
};
