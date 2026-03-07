// src/store/store.ts
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import formReducer from './slices/formSlice';
import chartReducer from './slices/chartSlice';
import { calculateChart } from './slices/chartSlice';
import { saveLastInput } from '../services/storageService';

// TSK-71: listener middleware — сохраняем форму после успешного расчёта
const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: calculateChart.fulfilled,
  effect: async (_action, api) => {
    const state = api.getState() as RootState;
    // silent fail — не ломаем UX если AsyncStorage недоступен
    await saveLastInput(state.form).catch(() => {});
  },
});

const store = configureStore({
  reducer: {
    form: formReducer,
    chart: chartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Игнорируем Date объекты в Redux
        ignoredActions: ['form/setBirthDate'],
        ignoredPaths: ['form.birth_date'],
      },
    }).prepend(listenerMiddleware.middleware),
  devTools: __DEV__,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
