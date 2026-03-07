// src/services/storageService.ts
// TSK-71: сохранение/загрузка последних данных формы из AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { STORAGE_KEYS } from '../config';
import type { FormState } from '../types/chart.types';

export interface StoredInput {
  birth_date_local: string; // "1990-06-15T09:00:00" — без Z, локальное время устройства
  location: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

// Сохранить данные формы после успешного расчёта
export async function saveLastInput(form: FormState): Promise<void> {
  if (!form.birth_date || form.latitude === null || form.longitude === null) return;
  const stored: StoredInput = {
    // format() из date-fns возвращает локальные компоненты даты — без суффикса Z
    // new Date("1990-06-15T09:00:00") парсится как локальное время ✓
    birth_date_local: format(form.birth_date, "yyyy-MM-dd'T'HH:mm:ss"),
    location: form.location,
    latitude: form.latitude,
    longitude: form.longitude,
    timezone: form.timezone,
  };
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_INPUT, JSON.stringify(stored));
}

// Загрузить сохранённые данные (null если нет или ошибка парсинга)
export async function loadLastInput(): Promise<StoredInput | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.LAST_INPUT);
  if (!raw) return null;
  return JSON.parse(raw) as StoredInput;
}
