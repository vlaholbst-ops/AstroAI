// src/services/nominatimApi.ts

/**
 * Nominatim Geocoding API
 * Документация: https://nominatim.org/release-docs/latest/api/Search/
 */

const NOMINATIM_CONFIG = {
  BASE_URL: 'https://nominatim.openstreetmap.org/search',
  USER_AGENT: 'AstroAI/1.0 (https://astroai.app)',
  TIMEOUT: 5000,
};

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
  };
}

export const searchLocation = async (query: string): Promise<NominatimResult[]> => {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '5',
  });

  try {
    const response = await fetch(`${NOMINATIM_CONFIG.BASE_URL}?${params}`, {
      headers: {
        'User-Agent': NOMINATIM_CONFIG.USER_AGENT,
      },
      // Убрали signal: AbortSignal.timeout() - не поддерживается в React Native
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as NominatimResult[];
  } catch (error) {
    console.error('Geocoding failed:', error);
    return [];
  }
};

export function formatLocationName(result: NominatimResult): string {
  const city =
    result.address?.city ||
    result.address?.town ||
    result.address?.village;
  const country = result.address?.country;

  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  // Fallback: первые две части display_name (город, страна)
  return result.display_name.split(', ').slice(0, 2).join(', ');
}
