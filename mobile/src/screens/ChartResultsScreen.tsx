// src/screens/ChartResultsScreen.tsx
// TSK-64: dark mode через useTheme() + fade-in анимация когда данные загружены.
// TSK-68: React Navigation — navigation prop, useFocusEffect для очистки Redux при уходе.
// TSK-70: ActivityIndicator при загрузке, классификация ошибок, кнопка «Попробовать снова».
// Skeleton показывается пока loading=true, контент появляется с fade-in (350 мс).
import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  clearChart,
  calculateChart,
  selectChartData,
  selectChartLoading,
  selectChartError,
} from '../store/slices/chartSlice';
import { selectFormData } from '../store/slices/formSlice';
import { PlanetCard, SIGN_NAMES } from '../components/PlanetCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { useTheme } from '../theme';
import type { House, AngularPoint } from '../types/chart.types';
import type { ChartResultsScreenNavigationProp } from '../navigation/types';

// ─── Константы ────────────────────────────────────────────────────────────────

const PLANET_ORDER = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

// ─── Хелперы ──────────────────────────────────────────────────────────────────

function getPlanetHouse(planetLon: number, houses: House[]): number {
  if (!houses || houses.length < 2) return 1;
  const cusps = houses.map((h) => h.longitude);

  for (let i = 0; i < cusps.length; i++) {
    const start = cusps[i];
    const end   = cusps[(i + 1) % cusps.length];
    if (start <= end) {
      if (planetLon >= start && planetLon < end) return i + 1;
    } else {
      if (planetLon >= start || planetLon < end) return i + 1;
    }
  }
  return 1;
}

// ─── TSK-70: Классификация ошибок для UI ──────────────────────────────────────

function getErrorMeta(msg: string | null): { icon: string; title: string } {
  if (msg === 'Проверьте интернет-соединение') {
    return { icon: '📡', title: 'Нет соединения' };
  }
  if (msg === 'Неверные данные') {
    return { icon: '⚠️', title: 'Неверные данные' };
  }
  return { icon: '🔧', title: 'Ошибка сервера' };
}

// ─── AngularCard ──────────────────────────────────────────────────────────────

interface AngularCardProps {
  label: string;
  symbol: string;
  accentColor: string;
  point: AngularPoint;
  isDark: boolean;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  subTextColor: string;
}

const AngularCard: React.FC<AngularCardProps> = ({
  label, symbol, accentColor, point,
  cardBg, cardBorder, textColor, subTextColor,
}) => {
  const signName = SIGN_NAMES[point.zodiac_sign] ?? point.zodiac_sign;
  const deg      = Math.floor(point.degree);

  return (
    <View
      style={[
        styles.angularCard,
        { backgroundColor: cardBg, borderColor: cardBorder },
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${signName} ${deg}°`}
    >
      <View style={[styles.symbolContainer, { backgroundColor: accentColor + '22' }]}>
        <Text style={[styles.angularSymbol, { color: accentColor }]}>{symbol}</Text>
      </View>
      <View style={styles.angularInfo}>
        <Text style={[styles.angularLabel, { color: textColor }]}>{label}</Text>
        <Text style={[styles.angularPosition, { color: subTextColor }]}>
          {signName} {deg}°
        </Text>
      </View>
    </View>
  );
};

// ─── ChartResultsScreen ───────────────────────────────────────────────────────

type Props = { navigation: ChartResultsScreenNavigationProp };

export const ChartResultsScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch           = useAppDispatch();
  const { colors, isDark } = useTheme();

  const chartData = useAppSelector(selectChartData);
  const loading   = useAppSelector(selectChartLoading);
  const error     = useAppSelector(selectChartError);
  const formData  = useAppSelector(selectFormData);

  // ── Fade-in: контент появляется плавно когда данные приходят ──────────────
  const contentFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (chartData) {
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      contentFadeAnim.setValue(0);
    }
  }, [chartData, contentFadeAnim]);

  // ── TSK-68: очищаем Redux при уходе с экрана (back gesture, hardware back) ──
  useFocusEffect(
    useCallback(() => {
      return () => {
        dispatch(clearChart());
      };
    }, [dispatch])
  );

  // ── Кнопка «Назад» ────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // ── TSK-70: «Попробовать снова» — перезапускает расчёт без возврата к форме
  const handleRetry = useCallback(() => {
    if (formData) {
      dispatch(calculateChart(formData));
    }
  }, [dispatch, formData]);

  // ── Состояние ошибки ──────────────────────────────────────────────────────

  if (error && !loading && !chartData) {
    const { icon, title } = getErrorMeta(error);
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={[
          styles.header,
          { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
        ]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <Text style={[styles.backText, { color: colors.text }]}>← Назад</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Натальная карта</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>{icon}</Text>
          <Text style={[styles.errorTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.errorText, { color: colors.textMuted }]}>{error}</Text>

          {/* Попробовать снова — перезапускает запрос (TSK-70) */}
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Попробовать снова</Text>
          </TouchableOpacity>

          {/* Вернуться к форме — ghost кнопка */}
          <TouchableOpacity
            style={[styles.backButtonOutline, { borderColor: colors.textMuted }]}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={[styles.backButtonOutlineText, { color: colors.textMuted }]}>
              ← Вернуться к форме
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Основной рендер ───────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>

      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: colors.header, borderBottomColor: colors.headerBorder },
      ]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Назад к форме"
        >
          <Text style={[styles.backText, { color: colors.text }]}>← Назад</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Натальная карта
        </Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── TSK-70: Loading indicator — ActivityIndicator + текст ─────── */}
        {loading && !chartData && (
          <View style={styles.loadingHeader}>
            <ActivityIndicator size="small" color="#6200EE" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Рассчитываем карту...
            </Text>
          </View>
        )}

        {/* ── Секция: Планеты ───────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Планеты</Text>

        {/* Skeleton — 10 заглушек пока loading=true */}
        {loading && !chartData &&
          Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={`skel-planet-${i}`} />
          ))
        }

        {/* Контент планет с fade-in. FlatList внутри ScrollView → .map() (CLAUDE.md) */}
        {chartData && (
          <Animated.View style={{ opacity: contentFadeAnim }}>
            {PLANET_ORDER.map((key) => {
              const planet = chartData.planets[key];
              if (!planet) return null;
              const house = getPlanetHouse(planet.longitude, chartData.houses.houses);
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
            })}
          </Animated.View>
        )}

        {/* ── Секция: Угловые точки (ASC / MC) ─────────────────────────── */}
        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced, { color: colors.textMuted }]}>
          Угловые точки
        </Text>

        {/* Skeleton для ASC/MC */}
        {loading && !chartData && (
          <>
            <SkeletonCard key="skel-asc" />
            <SkeletonCard key="skel-mc"  />
          </>
        )}

        {/* ASC и MC с fade-in */}
        {chartData && (
          <Animated.View style={{ opacity: contentFadeAnim }}>
            <AngularCard
              label="Асцендент (ASC)"
              symbol="↑"
              accentColor="#6200EE"
              point={chartData.houses.ascendant}
              isDark={isDark}
              cardBg={colors.card}
              cardBorder={colors.cardBorder}
              textColor={colors.text}
              subTextColor={colors.textSecondary}
            />
            <AngularCard
              label="Середина Неба (MC)"
              symbol="⊙"
              accentColor="#0277BD"
              point={chartData.houses.mc}
              isDark={isDark}
              cardBg={colors.card}
              cardBorder={colors.cardBorder}
              textColor={colors.text}
              subTextColor={colors.textSecondary}
            />
          </Animated.View>
        )}

        {/* Debug-баннер */}
        {__DEV__ && chartData && (
          <Animated.View
            style={[
              styles.debugBanner,
              { backgroundColor: colors.debugBg, opacity: contentFadeAnim },
            ]}
          >
            <Text style={[styles.debugText, { color: colors.textMuted }]}>
              {'🪐 Планет: ' + Object.keys(chartData.planets).length +
               '  🔗 Аспектов: ' + (chartData.aspects?.length ?? 0) +
               '  🏠 Домов: ' + chartData.houses.houses.length}
            </Text>
          </Animated.View>
        )}

      </ScrollView>
    </View>
  );
};

// ─── Стили ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

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
  headerRight: { minWidth: 72 },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // TSK-70: Loading indicator
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitleSpaced: { marginTop: 20 },

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
  symbolContainer: {
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
  angularInfo: { flex: 1 },
  angularLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  angularPosition: { fontSize: 14 },

  // Error state
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  // TSK-70: ghost кнопка «Вернуться к форме»
  backButtonOutline: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 200,
    alignItems: 'center',
  },
  backButtonOutlineText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Debug
  debugBanner: {
    marginTop: 24,
    borderRadius: 8,
    padding: 12,
  },
  debugText: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
