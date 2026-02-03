// src/store/slices/chartSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { ChartState, BirthData, NatalChart } from '../../types/chart.types';
import { API_CONFIG } from '../../config';

// Async Thunk для расчёта натальной карты
export const calculateChart = createAsyncThunk<
  NatalChart,           // Тип возвращаемого значения
  BirthData,            // Тип аргумента
  { rejectValue: string } // Тип ошибки
>(
  'chart/calculate',
  async (data: BirthData, { rejectWithValue }) => {
    try {
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
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Неизвестная ошибка');
    }
  }
);

const initialState: ChartState = {
  data: null,
  loading: false,
  error: null,
};

const chartSlice = createSlice({
  name: 'chart',
  initialState,
  reducers: {
    clearChart(state) {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(calculateChart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateChart.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(calculateChart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Ошибка расчёта карты';
      });
  },
});

export const { clearChart } = chartSlice.actions;
export default chartSlice.reducer;
