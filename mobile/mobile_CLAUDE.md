# Mobile Frontend

React Native 0.81 + Expo 54 + TypeScript 5.9 + Redux Toolkit.

## Quick Start
```bash
npm install
npm start       # Metro bundler
npm run ios     # iOS Simulator
npm run web     # Web localhost:19006
```

## Where Things Live
- Экраны: `src/screens/` (InputScreen.tsx — пока единственный)
- Компоненты: `src/components/` (BirthDatePicker, LocationAutocomplete, SubmitButton)
- Redux: `src/store/slices/` (formSlice — форма ввода, chartSlice — результат расчёта)
- API clients: `src/services/` (astrologyApi → backend, nominatimApi → геокодирование)
- Типы: `src/types/chart.types.ts`
- Config: `src/config.ts` (API_CONFIG.BASE_URL)

## Patterns
- **Redux + Async Thunks:** UI dispatch → thunk → API call → state update → re-render
- **Все даты в UTC** при отправке на backend. Конвертация через `fromZonedTime()` из `date-fns-tz`
- **Debounce 500ms** на поиск городов (Nominatim)
- **Platform checks** для web vs native: `Platform.OS === 'web'`

## Planned Screens (not yet built)
- ChartResultsScreen — отображение натальной карты
- InterpretationScreen — AI-интерпретация
- ChatScreen — чат с AI-астрологом
- AuthScreen, ProfileScreen, SavedChartsScreen
