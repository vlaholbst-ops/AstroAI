// src/services/astrologyApi.ts
import type { BirthData, NatalChart } from '../types/chart.types';
import { API_CONFIG } from '../config';

/**
 * Расчёт натальной карты через FastAPI backend
 * @param data - Данные рождения (UTC дата + координаты)
 * @returns Натальная карта с позициями планет и домов
 */
export const calculateNatalChart = async (data: BirthData): Promise<NatalChart> => {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CALCULATE_CHART}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }

  return await response.json();
};
