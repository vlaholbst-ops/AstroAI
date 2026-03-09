// src/screens/InputScreen.tsx
// TSK-64: dark mode через useTheme(). Палитра: light #FFFFFF/#000000, dark #1A1A1A/#FFFFFF.
// TSK-68: React Navigation — navigation prop, navigate('ChartResults') после dispatch.
import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setBirthDate,
  setLocation,
  setErrors,
  selectFormData,
  restoreFromStorage,
} from '../store/slices/formSlice';
import { calculateChart, selectChartLoading } from '../store/slices/chartSlice';
import { BirthDatePicker } from '../components/BirthDatePicker';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { loadLastInput } from '../services/storageService';
import { SubmitButton } from '../components/SubmitButton';
import { useTheme } from '../theme';
import type { InputScreenNavigationProp } from '../navigation/types';

type Props = { navigation: InputScreenNavigationProp };

export const InputScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch           = useAppDispatch();

  // TSK-71: предзаполнение формы из AsyncStorage при монтировании
  useEffect(() => {
    loadLastInput()
      .then(saved => { if (saved) dispatch(restoreFromStorage(saved)); })
      .catch(() => {}); // silent fail — не ломаем UX
  }, [dispatch]);
  const { colors, isDark } = useTheme();

  const formState    = useAppSelector((state) => state.form);
  const chartLoading = useAppSelector(selectChartLoading);
  const formData     = useAppSelector(selectFormData);

  // ── Валидация ─────────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formState.birth_date) {
      errors.birth_date = 'Укажите дату рождения';
    } else if (formState.birth_date > new Date()) {
      errors.birth_date = 'Дата не может быть в будущем';
    }

    if (!formState.latitude || !formState.longitude) {
      errors.location = 'Выберите город из списка';
    }

    if (Object.keys(errors).length > 0) {
      dispatch(setErrors(errors));
      return false;
    }
    return true;
  };

  // ── Отправка формы ────────────────────────────────────────────────────────
  // TSK-68: dispatch + navigate одновременно → скелетон в ChartResults во время загрузки

  const handleSubmit = () => {
    if (!validateForm()) return;
    if (!formData) return;

    // Запускаем расчёт (async thunk, не ждём результат)
    dispatch(calculateChart(formData));
    // Сразу переходим на экран результатов — он покажет скелетон
    navigation.navigate('ChartResults');
  };

  // ── Рендер ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Натальная карта
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Введите точные данные рождения для расчёта
          </Text>
        </View>

        {/* Форма */}
        <View style={[
          styles.form,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
            shadowColor: isDark ? '#000' : '#000',
          },
        ]}>
          <BirthDatePicker
            value={formState.birth_date}
            onChange={(date) => dispatch(setBirthDate(date))}
            error={formState.errors.birth_date}
            isDark={isDark}
          />

          <LocationAutocomplete
            value={formState.location}
            onSelect={(location, latitude, longitude, timezone) => {
              dispatch(setLocation({ location, latitude, longitude, timezone }));
            }}
            error={formState.errors.location}
          />

          <SubmitButton
            title="Рассчитать натальную карту"
            onPress={handleSubmit}
            loading={chartLoading}
            disabled={!formData}
            style={styles.submitButton}
          />
        </View>

        {/* Debug info */}
        {__DEV__ && formData && (
          <View style={[styles.debugContainer, { backgroundColor: colors.debugBg }]}>
            <Text style={[styles.debugTitle, { color: colors.textMuted }]}>Debug Info:</Text>
            <Text style={[
              styles.debugText,
              { color: colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
            ]}>
              {JSON.stringify(formData, null, 2)}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButton: {
    marginTop: 8,
  },
  debugContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 10,
  },
});
