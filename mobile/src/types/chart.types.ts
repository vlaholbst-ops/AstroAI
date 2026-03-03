// src/types/chart.types.ts
// TypeScript типы для API и Redux state

// Данные рождения (форма ввода)
export interface BirthData {
    birth_date: string;  // ISO 8601 UTC: "2000-01-01T09:00:00Z"
    latitude: number;    // -90..90
    longitude: number;   // -180..180
  }
  
  // Позиция планеты (из backend API)
  export interface PlanetPosition {
    planet: string;
    zodiac_sign: string;
    degree: number;
    longitude: number;
    retrograde: boolean;
  }
  
  // Дом (house) в натальной карте
  export interface House {
    house: number;       // 1-12
    zodiac_sign: string;
    degree: number;
    longitude: number;
  }
  
  // Угловые точки (Ascendant, MC)
  export interface AngularPoint {
    zodiac_sign: string;
    degree: number;
    longitude: number;
  }
  
  // Базовая натальная карта (планеты + дома)
  export interface NatalChart {
    planets: Record<string, PlanetPosition>;
    houses: {
      ascendant: AngularPoint;
      mc: AngularPoint;
      houses: House[];
    };
  }

  // Аспект между двумя планетами (из /calculate-chart-full)
  export interface Aspect {
    planet1: string;
    planet2: string;
    aspect_type: string;    // "Conjunction", "Opposition", "Trine", "Square", "Sextile"
    aspect_symbol: string;  // "☌", "☍", "△", "□", "⚹"
    angle: number;          // точный угол аспекта (0, 180, 120, 90, 60)
    exact_angle: number;    // целочисленный угол
    orb: number;            // отклонение от точного аспекта
    planet1_position: string; // "10.4° Козерог"
    planet2_position: string;
  }

  // Полная натальная карта с аспектами (из /calculate-chart-full)
  export interface NatalChartFull extends NatalChart {
    aspects: Aspect[];
  }

  // Nominatim API (геокодинг)
  export interface NominatimResult {
    display_name: string;  // "Москва, Россия"
    lat: string;           // "55.7558"
    lon: string;           // "37.6173"
    address?: {
      city?: string;
      country?: string;
    };
  }
  
  // Redux state для формы
  export interface FormState {
    birth_date: Date | null;
    location: string;
    latitude: number | null;
    longitude: number | null;
    timezone: string;
    errors: Record<string, string>;
  }
  
  // Redux state для натальной карты
  export interface ChartState {
    data: NatalChartFull | null;
    loading: boolean;
    error: string | null;
  }
  