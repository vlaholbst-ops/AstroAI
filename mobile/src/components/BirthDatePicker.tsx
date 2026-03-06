// src/components/BirthDatePicker.tsx
// TSK-64: добавлен isDark prop для поддержки dark mode.
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
  TextInput,
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
  isDark?: boolean;
}

export const BirthDatePicker: React.FC<BirthDatePickerProps> = ({
  value,
  onChange,
  error,
  isDark = false,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const maxDate = new Date();

  // Цвета в зависимости от темы
  const labelColor       = isDark ? '#D1D5DB' : '#333333';
  const inputBg          = isDark ? '#1E1E2E' : '#FFFFFF';
  const inputBorderColor = error ? '#B00020' : (isDark ? '#3E3E4E' : '#DDDDDD');
  const textColor        = isDark ? '#FFFFFF' : '#000000';
  const placeholderColor = isDark ? '#6B7280' : '#999999';

  // WEB: HTML5 datetime-local input
  if (isWeb) {
    return (
      <View style={styles.container}>
        <Text style={[styles.label, { color: labelColor }]}>
          Дата и время рождения
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: inputBg,
              borderColor: inputBorderColor,
              color: textColor,
            },
          ]}
          value={value ? format(value, "yyyy-MM-dd'T'HH:mm") : ''}
          onChangeText={(text) => {
            const newDate = new Date(text);
            if (!isNaN(newDate.getTime())) {
              onChange(newDate);
            }
          }}
          placeholder="Выберите дату и время"
          placeholderTextColor={placeholderColor}
          // @ts-ignore — Web-specific prop
          type="datetime-local"
          max={format(maxDate, "yyyy-MM-dd'T'HH:mm")}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

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
      setShowTimePicker(true);
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
      <Text style={[styles.label, { color: labelColor }]}>
        Дата и время рождения
      </Text>

      <TouchableOpacity
        style={[
          styles.input,
          {
            backgroundColor: inputBg,
            borderColor: inputBorderColor,
          },
        ]}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.inputText,
          { color: value ? textColor : placeholderColor },
        ]}>
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
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  inputText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#B00020',
    marginTop: 4,
  },
});
