// src/services/timezoneService.ts
// Определение IANA timezone по координатам.
//
// geo-tz@8.x требует Node.js fs (несовместим с React Native) — используем HTTP API.
// Primary: BigDataCloud (бесплатно, без ключа, возвращает IANA timezone ID).
// Fallback: longitude-based Etc/GMT±N (без учёта DST, работает оффлайн).

const TIMEZONE_API_URL =
  'https://api.bigdatacloud.net/data/timezone-by-location';
const TIMEOUT_MS = 4000;

interface BigDataCloudTzResponse {
  ianaTimeId: string;
  countryName?: string;
}

/**
 * Возвращает IANA timezone string для заданных координат.
 * Пример: getTimezoneByCoords(55.75, 37.62) → "Europe/Moscow"
 */
export async function getTimezoneByCoords(
  lat: number,
  lon: number,
): Promise<string> {
  try {
    const url =
      `${TIMEZONE_API_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=en`;

    // AbortSignal.timeout() не поддерживается на iOS — используем AbortController
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timerId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data: BigDataCloudTzResponse = await response.json();
    if (data.ianaTimeId) return data.ianaTimeId;

    throw new Error('No ianaTimeId in response');
  } catch {
    // Fallback: округлённый UTC-offset по долготе
    return longitudeToEtcGmt(lon);
  }
}

/**
 * Конвертирует долготу в Etc/GMT timezone.
 * Внимание: знак инвертирован по POSIX-соглашению.
 *   Etc/GMT-3 = UTC+3 (Москва), Etc/GMT+5 = UTC-5 (Нью-Йорк)
 */
function longitudeToEtcGmt(lon: number): string {
  const offsetHours = Math.round(lon / 15);
  if (offsetHours === 0) return 'UTC';
  return offsetHours > 0
    ? `Etc/GMT-${offsetHours}`
    : `Etc/GMT+${Math.abs(offsetHours)}`;
}
