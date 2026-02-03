// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import formReducer from './slices/formSlice';
import chartReducer from './slices/chartSlice';

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
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
