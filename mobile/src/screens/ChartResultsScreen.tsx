// src/screens/ChartResultsScreen.tsx
// Экран результатов натальной карты
// Зависит от: TSK-63 (chartSlice selectors), TSK-61 (PlanetCard)
import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Platform,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  clearChart,
  selectChartData,
  selectChartLoading,
  selectChartError,
} from '../store/slices/chartSlice';
import { PlanetCard, SIGN_NAMES } from '../components/PlanetCard';
import { SkeletonCard } from '../components/SkeletonCard';
import type { House, AngularPoint } from '../types/chart.types';

// ─── Константы ────────────────────────────────────────────────────────────────

// Стандартный астрологический порядок планет
const PLANET_ORDER = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

// ─── Вспомогательные функции ──────────────────────────────────────────────────

/**
 * Определяет номер дома (1-12) для планеты по её эклиптической долготе.
 * Сравнивает долготу планеты с куспидами домов.
 */
function getPlanetHouse(planetLon: number, houses: House[]): number {
  if (!houses || houses.length < 2) return 1;

  const cusps = houses.map((h) => h.longitude);

  for (let i = 0; i < cusps.length; i++) {
    const start = cusps[i];
    const end   = cusps[(i + 1) % cusps.length];

    if (start <= end) {
      // Обычный случай: нет перехода через 0°
      if (planetLon >= start && planetLon < end) return i + 1;
    } else {
      // Переход через 0° (например, куспид 350° → следующий 10°)
      if (planetLon >= start || planetLon < end) return i + 1;
    }
  }

  return 1; // fallback
}

// ─── AngularCard (ASC / MC) ───────────────────────────────────────────────────

interface AngularCardProps {
  label: string;
  symbol: string;
  accentColor: string;
  point: AngularPoint;
  isDark: boolean;
}

const AngularCard: React.FC<AngularCardProps> = ({
  label,
  symbol,
  accentColor,
  point,
  isDark,
}) => {
  const signName = SIGN_NAMES[point.zodiac_sign] ?? point.zodiac_sign;
  const deg      = Math.floor(point.degree);

  return (
    <View
      style={[
        styles.angularCard,
        isDark ? styles.cardDark : styles.cardLight,
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${signName} ${deg}°`}
    >
      {/* Символ */}
      <View
        style={[
          styles.angularSymbolContainer,
          { backgroundColor: accentColor + '22' },
        ]}
      >
        <Text style={[styles.angularSymbol, { color: accentColor }]}>
          {symbol}
        </Text>
      </View>

      {/* Текст */}
      <View style={styles.angularInfo}>
        <Text
          style={[
            styles.angularLabel,
            isDark ? styles.textDark : styles.textLight,
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.angularPosition,
            isDark ? styles.subTextDark : styles.subTextLight,
          ]}
        >
          {signName} {deg}°
        </Text>
      </View>
    </View>
  );
};

// ─── ChartResultsScreen ───────────────────────────────────────────────────────

export const ChartResultsScreen: React.FC = () => {
  const dispatch    = useAppDispatch();
  const colorScheme = useColorScheme();
  const isDark      = colorScheme === 'dark';

  const chartData = useAppSelector(selectChartData);
  const loading   = useAppSelector(selectChartLoading);
  const error     = useAppSelector(selectChartError);

  const handleBack = useCallback(() => {
    dispatch(clearChart());
  }, [dispatch]);

  // Цветовая схема экрана
  const screenBg   = isDark ? '#0F0F1A' : '#F3F4F6';
  const headerBg   = isDark ? '#1E1E2E' : '#FFFFFF';
  const headerBorder = isDark ? '#2E2E3E' : '#E8E8EE';

  // ── Состояние ошибки ─────────────────────────────────────────────────────

  if (error && !loading && !chartData) {
    return (
      <View style={[styles.container, { backgroundColor: screenBg }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: headerBg, borderBottomColor: headerBorder },
          ]}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.backText, isDark ? styles.textDark : styles.textLight]}>
              ← Назад
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark ? styles.textDark : styles.textLight]}>
            Натальная карта
          </Text>
          <View style={styles.headerRight} />
        </View>

        {/* Error */}
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={[styles.errorTitle, isDark ? styles.textDark : styles.textLight]}>
            Ошибка расчёта
          </Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
            <Text style={styles.retryText}>← Вернуться к форме</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Основной рендер ──────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: headerBg, borderBottomColor: headerBorder },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Назад к форме"
        >
          <Text style={[styles.backText, isDark ? styles.textDark : styles.textLight]}>
            ← Назад
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, isDark ? styles.textDark : styles.textLight]}>
          Натальная карта
        </Text>

        {/* Правый placeholder для центровки заголовка */}
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Секция: Планеты ─────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>
          Планеты
        </Text>

        {/* Skeleton loader — 10 заглушек пока loading=true и данных нет */}
        {loading && !chartData &&
          Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={`skel-planet-${i}`} isDark={isDark} />
          ))
        }

        {/* Реальные данные — список планет через .map() */}
        {/* Правило CLAUDE.md: FlatList внутри ScrollView → использовать .map() */}
        {chartData &&
          PLANET_ORDER.map((key) => {
            const planet = chartData.planets[key];
            if (!planet) return null;

            const house = getPlanetHouse(
              planet.longitude,
              chartData.houses.houses,
            );

            return (
              <PlanetCard
                key={key}
                planet={key}
                sign={planet.zodiac_sign}
                degree={planet.degree}
                house={house}
                retrograde={planet.retrograde}
              />
            );
          })
        }

        {/* ── Секция: Угловые точки (ASC / MC) ────────────────────────────── */}
        <Text
          style={[
            styles.sectionTitle,
            styles.sectionTitleSpaced,
            isDark ? styles.textDark : styles.textLight,
          ]}
        >
          Угловые точки
        </Text>

        {/* Skeleton для ASC/MC */}
        {loading && !chartData && (
          <>
            <SkeletonCard key="skel-asc" isDark={isDark} />
            <SkeletonCard key="skel-mc"  isDark={isDark} />
          </>
        )}

        {/* ASC и MC */}
        {chartData && (
          <>
            <AngularCard
              label="Асцендент (ASC)"
              symbol="↑"
              accentColor="#6200EE"
              point={chartData.houses.ascendant}
              isDark={isDark}
            />
            <AngularCard
              label="Середина Неба (MC)"
              symbol="⊙"
              accentColor="#0277BD"
              point={chartData.houses.mc}
              isDark={isDark}
            />
          </>
        )}

        {/* ── Debug: счётчик аспектов ──────────────────────────────────────── */}
        {__DEV__ && chartData && (
          <View style={[styles.debugBanner, isDark ? styles.debugDark : styles.debugLight]}>
            <Text style={styles.debugText}>
              🪐 Планет: {Object.keys(chartData.planets).length}
              {'  '}
              🔗 Аспектов: {chartData.aspects?.length ?? 0}
              {'  '}
              🏠 Домов: {chartData.houses.houses.length}
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
};

// ─── Стили ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
    minWidth: 72,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    minWidth: 72,  // симметрично backButton
  },

  // ScrollView
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Section headers
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitleSpaced: {
    marginTop: 20,
  },

  // AngularCard
  angularCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  angularSymbolContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  angularSymbol: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  angularInfo: {
    flex: 1,
  },
  angularLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  angularPosition: {
    fontSize: 14,
  },

  // Error state
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Debug
  debugBanner: {
    marginTop: 24,
    borderRadius: 8,
    padding: 12,
  },
  debugLight: { backgroundColor: '#F0F0F0' },
  debugDark:  { backgroundColor: '#1A1A2E' },
  debugText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Card themes (shared for AngularCard)
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E8EE',
  },
  cardDark: {
    backgroundColor: '#1E1E2E',
    borderColor: '#2E2E3E',
  },

  // Text themes
  textLight:    { color: '#111827' },
  textDark:     { color: '#F9FAFB' },
  subTextLight: { color: '#374151' },
  subTextDark:  { color: '#D1D5DB' },
});
