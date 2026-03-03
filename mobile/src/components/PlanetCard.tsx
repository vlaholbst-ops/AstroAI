// src/components/PlanetCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ViewStyle,
} from 'react-native';

// ─── Типы ────────────────────────────────────────────────────────────────────

export type PlanetKey =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

export type SignKey =
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export interface PlanetCardProps {
  planet: PlanetKey | string;
  sign: SignKey | string;
  degree: number;
  house: number;
  retrograde?: boolean;
  style?: ViewStyle;
}

// ─── Справочники ─────────────────────────────────────────────────────────────

// Unicode-символы планет
export const PLANET_SYMBOLS: Record<string, string> = {
  sun:         '☉',
  moon:        '☽',
  mercury:     '☿',
  venus:       '♀',
  mars:        '♂',
  jupiter:     '♃',
  saturn:      '♄',
  uranus:      '♅',
  neptune:     '♆',
  pluto:       '♇',
};

// Русские названия планет
export const PLANET_NAMES: Record<string, string> = {
  sun:         'Солнце',
  moon:        'Луна',
  mercury:     'Меркурий',
  venus:       'Венера',
  mars:        'Марс',
  jupiter:     'Юпитер',
  saturn:      'Сатурн',
  uranus:      'Уран',
  neptune:     'Нептун',
  pluto:       'Плутон',
};

// Русские названия знаков зодиака
export const SIGN_NAMES: Record<string, string> = {
  aries:         'Овен',
  taurus:        'Телец',
  gemini:        'Близнецы',
  cancer:        'Рак',
  leo:           'Лев',
  virgo:         'Дева',
  libra:         'Весы',
  scorpio:       'Скорпион',
  sagittarius:   'Стрелец',
  capricorn:     'Козерог',
  aquarius:      'Водолей',
  pisces:        'Рыбы',
};

// Акцентный цвет каждой планеты
export const PLANET_COLORS: Record<string, string> = {
  sun:         '#FFB300',
  moon:        '#90A4AE',
  mercury:     '#78909C',
  venus:       '#EC407A',
  mars:        '#EF5350',
  jupiter:     '#7B1FA2',
  saturn:      '#8D6E63',
  uranus:      '#26C6DA',
  neptune:     '#3F51B5',
  pluto:       '#546E7A',
};

// ─── Вспомогательные функции ──────────────────────────────────────────────────

/** «1-й дом», «2-й дом», … «12-й дом» */
export function houseLabel(house: number): string {
  return `${house}-й дом`;
}

/** «Солнце: Овен 15° (1-й дом)» — полная строка для accessibility */
export function planetFullLabel(
  planet: string,
  sign: string,
  degree: number,
  house: number,
  retrograde: boolean,
): string {
  const name   = PLANET_NAMES[planet]  ?? planet;
  const sign_  = SIGN_NAMES[sign]      ?? sign;
  const deg    = Math.floor(degree);
  const retro  = retrograde ? ', ретроградный' : '';
  return `${name}: ${sign_} ${deg}° (${houseLabel(house)})${retro}`;
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export const PlanetCard: React.FC<PlanetCardProps> = ({
  planet,
  sign,
  degree,
  house,
  retrograde = false,
  style,
}) => {
  const colorScheme = useColorScheme();
  const isDark      = colorScheme === 'dark';

  const symbol      = PLANET_SYMBOLS[planet]  ?? '★';
  const planetName  = PLANET_NAMES[planet]    ?? planet;
  const signName    = SIGN_NAMES[sign]        ?? sign;
  const accentColor = PLANET_COLORS[planet]   ?? '#6200EE';
  const deg         = Math.floor(degree);

  return (
    <View
      style={[
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        style,
      ]}
      testID="planet-card"
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={planetFullLabel(planet, sign, degree, house, retrograde)}
    >
      {/* Символ планеты */}
      <View
        style={[
          styles.symbolContainer,
          { backgroundColor: accentColor + '22' },   // 13% opacity
        ]}
      >
        <Text
          style={[styles.symbol, { color: accentColor }]}
          testID="planet-symbol"
        >
          {symbol}
        </Text>
      </View>

      {/* Текстовая информация */}
      <View style={styles.info}>
        {/* Строка 1: «Солнце  ℞» */}
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.planetName,
              isDark ? styles.textDark : styles.textLight,
            ]}
            testID="planet-name"
          >
            {planetName}
          </Text>
          {retrograde && (
            <Text
              style={[styles.retroBadge, { color: accentColor }]}
              testID="retro-badge"
            >
              {' ℞'}
            </Text>
          )}
        </View>

        {/* Строка 2: «Овен 15°» */}
        <Text
          style={[
            styles.position,
            isDark ? styles.subTextDark : styles.subTextLight,
          ]}
          testID="planet-position"
        >
          {`${signName} ${deg}°`}
        </Text>

        {/* Строка 3: «1-й дом» */}
        <Text
          style={[
            styles.house,
            isDark ? styles.houseTextDark : styles.houseTextLight,
          ]}
          testID="planet-house"
        >
          {houseLabel(house)}
        </Text>
      </View>
    </View>
  );
};

// ─── Стили ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Карточка
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8EE',
  },
  cardDark: {
    backgroundColor: '#1E1E2E',
    borderWidth: 1,
    borderColor: '#2E2E3E',
  },

  // Символ
  symbolContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  symbol: {
    fontSize: 24,
    lineHeight: 28,
  },

  // Информация
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  planetName: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  retroBadge: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  position: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 2,
  },
  house: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Light theme
  textLight:     { color: '#111827' },
  subTextLight:  { color: '#374151' },
  houseTextLight:{ color: '#9CA3AF' },

  // Dark theme
  textDark:      { color: '#F9FAFB' },
  subTextDark:   { color: '#D1D5DB' },
  houseTextDark: { color: '#6B7280' },
});
