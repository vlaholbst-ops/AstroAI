// src/store/slices/chartSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { ChartState, BirthData, NatalChartFull } from '../../types/chart.types';
import { calculateChartFull } from '../../services/astrologyApi';

// Async Thunk для расчёта натальной карты (планеты + дома + аспекты)
export const calculateChart = createAsyncThunk<
  NatalChartFull,         // Тип возвращаемого значения
  BirthData,              // Тип аргумента
  { rejectValue: string } // Тип ошибки
>(
  'chart/calculate',
  async (data: BirthData, { rejectWithValue }) => {
    try {
      return await calculateChartFull(data);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Неизвестная ошибка');
    }
  }
);

const initialState: ChartState = {
  chartData: null,
  loading: false,
  error: null,
};

const chartSlice = createSlice({
  name: 'chart',
  initialState,
  reducers: {
    clearChart(state) {
      state.chartData = null;
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
        state.chartData = action.payload;
      })
      .addCase(calculateChart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Ошибка расчёта карты';
      });
  },
});

export const { clearChart } = chartSlice.actions;
export default chartSlice.reducer;

// Selectors
export const selectChartData = (state: RootState) => state.chart.chartData;
export const selectChartLoading = (state: RootState) => state.chart.loading;
export const selectChartError = (state: RootState) => state.chart.error;
export const selectChartIsLoaded = (state: RootState) => state.chart.chartData !== null;
