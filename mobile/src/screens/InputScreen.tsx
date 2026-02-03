// src/screens/InputScreen.tsx
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
import { calculateChart } from '../store/slices/chartSlice';
import { BirthDatePicker } from '../components/BirthDatePicker';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { SubmitButton } from '../components/SubmitButton';

export const InputScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  // Redux state
  const formState = useAppSelector((state) => state.form);
  const chartState = useAppSelector((state) => state.chart);
  const formData = useAppSelector(selectFormData);

  // Валидация формы
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

  // Обработка отправки формы
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!formData) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    try {
      await dispatch(calculateChart(formData)).unwrap();
      Alert.alert('Успех', 'Натальная карта рассчитана!');
    } catch (error) {
      Alert.alert('Ошибка', error as string);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Натальная карта</Text>
          <Text style={styles.subtitle}>
            Введите точные данные рождения для расчёта
          </Text>
        </View>

        <View style={styles.form}>
          <BirthDatePicker
            value={formState.birth_date}
            onChange={(date) => dispatch(setBirthDate(date))}
            error={formState.errors.birth_date}
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
            loading={chartState.loading}
            disabled={!formData}
            style={styles.submitButton}
          />
        </View>

        {/* Debug info (удалить в production) */}
        {__DEV__ && formData && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>
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
    backgroundColor: '#f5f5f5',
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
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
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
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
