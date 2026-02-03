// src/components/LocationAutocomplete.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import debounce from 'lodash.debounce';
import { searchLocation, formatLocationName } from '../services/nominatimApi';
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
      } catch (error) {
        console.error('Search failed:', error);
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

  // Очистка debounce при unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Место рождения</Text>

      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={query}
        onChangeText={handleChangeText}
        placeholder="Начните вводить город..."
        placeholderTextColor="#999"
        autoCorrect={false}
        onFocus={() => setShowResults(true)}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#6200EE" />
        </View>
      )}

      {showResults && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.lat}-${item.lon}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelectLocation(item)}
              >
                <Text style={styles.resultText}>
                  {formatLocationName(item)}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.resultsList}
          />
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
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#B00020',
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
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsList: {
    flexGrow: 0,
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultText: {
    fontSize: 14,
    color: '#333',
  },
});
