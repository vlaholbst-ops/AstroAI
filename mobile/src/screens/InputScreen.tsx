// src/screens/InputScreen.tsx
// TSK-64: dark mode через useTheme(). Палитра: light #FFFFFF/#000000, dark #1A1A1A/#FFFFFF.
import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setBirthDate,
  setLocation,
  setErrors,
  selectFormData,
} from '../store/slices/formSlice';
import { calculateChart, selectChartLoading } from '../store/slices/chartSlice';
import { BirthDatePicker } from '../components/BirthDatePicker';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { SubmitButton } from '../components/SubmitButton';
import { useTheme } from '../theme';

export const InputScreen: React.FC = () => {
  const dispatch           = useAppDispatch();
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!formData) {
      // Alert.alert не работает на Web (CLAUDE.md)
      if (Platform.OS === 'web') {
        alert('Заполните все поля');
      } else {
        Alert.alert('Ошибка', 'Заполните все поля');
      }
      return;
    }

    try {
      const result = await dispatch(calculateChart(formData)).unwrap();

      if (Platform.OS === 'web') {
        alert(
          '✅ Успех! Натальная карта рассчитана!\n\n' +
          'Планет найдено: ' + Object.keys(result.planets || {}).length + '\n' +
          'Домов найдено: ' + (result.houses?.houses?.length || 0)
        );
        console.log('🎉 Natal Chart Result:', result);
      } else {
        Alert.alert('Успех', 'Натальная карта рассчитана!', [
          { text: 'OK', onPress: () => console.log('Chart calculated') },
        ]);
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('❌ Ошибка: ' + (error as string));
      } else {
        Alert.alert('Ошибка', error as string);
      }
    }
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
            onSelect={(location, latitude, longitude) => {
              dispatch(setLocation({ location, latitude, longitude }));
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
