// src/services/astrologyApi.ts
// TSK-70: классификация ошибок (сеть / 4xx / 5xx), не ретраить сетевые ошибки.
import type { BirthData, NatalChart, NatalChartFull } from '../types/chart.types';
import { API_CONFIG } from '../config';

// AbortSignal.timeout() не поддерживается на iOS — используем AbortController вручную
function makeTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

// Выполнить POST-запрос с retry 1 раз при ошибке сервера (5xx).
// Сетевые ошибки и 4xx НЕ ретраятся — это ухудшает UX (двойной таймаут).
async function postWithRetry<T>(
  url: string,
  body: unknown,
  retries = 1,
): Promise<T> {
  const attempt = async (): Promise<T> => {
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: makeTimeoutSignal(API_CONFIG.TIMEOUT),
      });
    } catch {
      // fetch() не смог выполниться: нет сети, таймаут, DNS-ошибка
      throw new Error('Проверьте интернет-соединение');
    }

    if (!response.ok) {
      if (response.status >= 400 && response.status < 500) {
        // 400/422 и другие клиентские ошибки
        throw new Error('Неверные данные');
      }
      // 500+ — ошибка сервера
      throw new Error('Ошибка сервера');
    }

    return response.json();
  };

  try {
    return await attempt();
  } catch (err) {
    const msg = (err as Error).message;
    // Ретраим ТОЛЬКО ошибки сервера (5xx). Сетевые и 4xx — без retry.
    if (retries > 0 && msg === 'Ошибка сервера') {
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
