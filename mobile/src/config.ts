// src/config.ts
// Конфигурация для разработки (без .env)

const isDevelopment = __DEV__; // Expo/React Native константа

export const API_CONFIG = {
  // Для эмулятора iOS: используй localhost
  // Для эмулятора Android: используй 10.0.2.2
  // Для реального устройства: используй IP компьютера
  BASE_URL: isDevelopment 
    ? 'http://localhost:8000'  // Измени на свой IP если нужно
    : 'https://astroai-api.production.com', // Production URL (когда задеплоишь)
  
  ENDPOINTS: {
    CALCULATE_CHART: '/api/astrology/calculate-chart',
  },
  
  TIMEOUT: 10000, // 10 секунд
};

// Nominatim API (OpenStreetMap)
export const NOMINATIM_CONFIG = {
  BASE_URL: 'https://nominatim.openstreetmap.org',
  USER_AGENT: 'AstroAI/1.0', // ОБЯЗАТЕЛЬНО для Nominatim
};
