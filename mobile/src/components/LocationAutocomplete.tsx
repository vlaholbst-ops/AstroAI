// src/components/LocationAutocomplete.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import debounce from 'lodash.debounce';
import { searchLocation, formatLocationName } from '../services/nominatimApi';
import { useTheme } from '../theme';
import type { NominatimResult } from '../types/chart.types';

interface LocationAutocompleteProps {
  value: string;
  onSelect: (location: string, latitude: number, longitude: number) => void;
  error?: string;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onSelect,
  error,
}) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced поиск (500ms задержка)
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 3) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await searchLocation(searchQuery);
        setResults(data);
      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  const handleChangeText = (text: string) => {
    setQuery(text);
    setShowResults(true);
    debouncedSearch(text);
  };

  const handleSelectLocation = (result: NominatimResult) => {
    const formattedName = formatLocationName(result);
    setQuery(formattedName);
    setShowResults(false);
    onSelect(
      formattedName,
      parseFloat(result.lat),
      parseFloat(result.lon)
    );
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.label }]}>
        Место рождения
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: error ? '#B00020' : colors.inputBorder,
            color: colors.text,
          },
        ]}
        value={query}
        onChangeText={handleChangeText}
        placeholder="Начните вводить город..."
        placeholderTextColor={colors.placeholder}
        autoCorrect={false}
        onFocus={() => setShowResults(true)}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#6200EE" />
        </View>
      )}

      {/* FlatList запрещён внутри ScrollView (CLAUDE.md) — используем .map() */}
      {showResults && results.length > 0 && (
        <View
          style={[
            styles.resultsContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <ScrollView
            style={styles.resultsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {results.map((item, index) => (
              <TouchableOpacity
                key={`${item.lat}-${item.lon}-${index}`}
                style={[
                  styles.resultItem,
                  { borderBottomColor: colors.cardBorder },
                ]}
                onPress={() => handleSelectLocation(item)}
              >
                <Text style={[styles.resultText, { color: colors.text }]}>
                  {formatLocationName(item)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    zIndex: 1,
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
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#B00020',
    marginTop: 4,
  },
  loadingContainer: {
    position: 'absolute',
    right: 16,
    top: 48,
  },
  resultsContainer: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    elevation: 3,
  },
  resultsList: {
    flexGrow: 0,
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  resultText: {
    fontSize: 14,
  },
});
