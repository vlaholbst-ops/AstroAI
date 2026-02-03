// src/components/BirthDatePicker.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface BirthDatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
}

export const BirthDatePicker: React.FC<BirthDatePickerProps> = ({
  value,
  onChange,
  error,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  const isIOS = Platform.OS === 'ios';
  const maxDate = new Date(); // Запрет выбора будущих дат

  // iOS: один picker для date + time
  const handleIOSChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      onChange(selectedDate);
      setTempDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  // Android: date picker
  const handleAndroidDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setTempDate(selectedDate);
      setShowTimePicker(true); // Сразу показываем time picker
    }
  };

  // Android: time picker
  const handleAndroidTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date
  ) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selectedTime) {
      const combined = new Date(tempDate);
      combined.setHours(selectedTime.getHours());
      combined.setMinutes(selectedTime.getMinutes());
      onChange(combined);
      setTempDate(combined);
    }
  };

  const displayValue = value
    ? format(value, 'dd MMMM yyyy, HH:mm', { locale: ru })
    : 'Выберите дату и время';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Дата и время рождения</Text>

      <TouchableOpacity
        style={[styles.input, error && styles.inputError]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {displayValue}
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* iOS: datetime picker */}
      {isIOS && showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="datetime"
          display="spinner"
          maximumDate={maxDate}
          onChange={handleIOSChange}
          locale="ru-RU"
        />
      )}

      {/* Android: date picker */}
      {!isIOS && showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          maximumDate={maxDate}
          onChange={handleAndroidDateChange}
        />
      )}

      {/* Android: time picker */}
      {!isIOS && showTimePicker && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          is24Hour={true}
          onChange={handleAndroidTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#B00020',
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#999',
  },
  errorText: {
    fontSize: 12,
    color: '#B00020',
    marginTop: 4,
  },
});
