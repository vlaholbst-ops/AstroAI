// src/store/slices/formSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import type { FormState, BirthData } from '../../types/chart.types';
import type { RootState } from '../store';

const initialState: FormState = {
  birth_date: null,
  location: '',
  latitude: null,
  longitude: null,
  timezone: 'Europe/Moscow', // Дефолт для России
  errors: {},
};

const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    setBirthDate(state, action: PayloadAction<Date>) {
      state.birth_date = action.payload;
      delete state.errors.birth_date;
    },
    
    setLocation(state, action: PayloadAction<{
      location: string;
      latitude: number;
      longitude: number;
      timezone?: string;
    }>) {
      state.location = action.payload.location;
      state.latitude = action.payload.latitude;
      state.longitude = action.payload.longitude;
      if (action.payload.timezone) {
        state.timezone = action.payload.timezone;
      }
      delete state.errors.location;
    },
    
    setErrors(state, action: PayloadAction<Record<string, string>>) {
      state.errors = action.payload;
    },
    
    resetForm(state) {
      return initialState;
    },
  },
});

export const { setBirthDate, setLocation, setErrors, resetForm } = formSlice.actions;

// Selector для получения валидных данных с timezone конвертацией
export const selectFormData = (state: RootState): BirthData | null => {
  const { birth_date, latitude, longitude, timezone } = state.form;
  
  if (!birth_date || latitude === null || longitude === null) {
    return null;
  }
  
  // КРИТИЧНО: конвертация local time → UTC
  const utcDate = fromZonedTime(birth_date, timezone);
  
  return {
    birth_date: utcDate.toISOString(), // "2000-01-01T09:00:00.000Z"
    latitude,
    longitude,
  };
};

// Selector для проверки валидности формы
export const selectFormIsValid = (state: RootState): boolean => {
  return selectFormData(state) !== null;
};

export default formSlice.reducer;
