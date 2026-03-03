// src/services/astrologyApi.ts
import type { BirthData, NatalChart, NatalChartFull } from '../types/chart.types';
import { API_CONFIG } from '../config';

// AbortSignal.timeout() не поддерживается на iOS — используем AbortController вручную
function makeTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

// Выполнить POST-запрос с retry 1 раз при ошибке
async function postWithRetry<T>(
  url: string,
  body: unknown,
  retries = 1,
): Promise<T> {
  const attempt = async (): Promise<T> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: makeTimeoutSignal(API_CONFIG.TIMEOUT),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  };

  try {
    return await attempt();
  } catch (err) {
    if (retries > 0) {
      return postWithRetry<T>(url, body, retries - 1);
    }
    throw err;
  }
}

/**
 * Базовый расчёт натальной карты (планеты + дома)
 */
export const calculateNatalChart = async (data: BirthData): Promise<NatalChart> => {
  return postWithRetry<NatalChart>(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CALCULATE_CHART}`,
    data,
  );
};

/**
 * Полный расчёт натальной карты (планеты + дома + аспекты).
 * Используется как основной вызов из Redux thunk.
 */
export const calculateChartFull = async (data: BirthData): Promise<NatalChartFull> => {
  return postWithRetry<NatalChartFull>(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CALCULATE_CHART_FULL}`,
    data,
  );
};
