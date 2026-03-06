// src/components/PlanetCard.tsx
// TSK-64: переведён на useTheme() вместо прямого useColorScheme().
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

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

export const PLANET_SYMBOLS: Record<string, string> = {
  sun:       '☉',
  moon:      '☽',
  mercury:   '☿',
  venus:     '♀',
  mars:      '♂',
  jupiter:   '♃',
  saturn:    '♄',
  uranus:    '♅',
  neptune:   '♆',
  pluto:     '♇',
};

export const PLANET_NAMES: Record<string, string> = {
  sun:       'Солнце',
  moon:      'Луна',
  mercury:   'Меркурий',
  venus:     'Венера',
  mars:      'Марс',
  jupiter:   'Юпитер',
  saturn:    'Сатурн',
  uranus:    'Уран',
  neptune:   'Нептун',
  pluto:     'Плутон',
};

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

export const PLANET_COLORS: Record<string, string> = {
  sun:       '#FFB300',
  moon:      '#90A4AE',
  mercury:   '#78909C',
  venus:     '#EC407A',
  mars:      '#EF5350',
  jupiter:   '#7B1FA2',
  saturn:    '#8D6E63',
  uranus:    '#26C6DA',
  neptune:   '#3F51B5',
  pluto:     '#546E7A',
};

// ─── Хелперы ─────────────────────────────────────────────────────────────────

export function houseLabel(house: number): string {
  return `${house}-й дом`;
}

export function planetFullLabel(
  planet: string,
  sign: string,
  degree: number,
  house: number,
  retrograde: boolean,
): string {
  const name  = PLANET_NAMES[planet] ?? planet;
  const sign_ = SIGN_NAMES[sign]     ?? sign;
  const deg   = Math.floor(degree);
  const retro = retrograde ? ', ретроградный' : '';
  return `${name}: ${sign_} ${deg}° (${houseLabel(house)})${retro}`;
}

// ─── Компонент ───────────────────────────────────────────────────────────────

export const PlanetCard: React.FC<PlanetCardProps> = ({
  planet,
  sign,
  degree,
  house,
  retrograde = false,
  style,
}) => {
  const { colors } = useTheme();

  const symbol      = PLANET_SYMBOLS[planet] ?? '★';
  const planetName  = PLANET_NAMES[planet]   ?? planet;
  const signName    = SIGN_NAMES[sign]        ?? sign;
  const accentColor = PLANET_COLORS[planet]   ?? '#6200EE';
  const deg         = Math.floor(degree);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
        style,
      ]}
      testID="planet-card"
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={planetFullLabel(planet, sign, degree, house, retrograde)}
    >
      {/* Символ планеты */}
      <View style={[styles.symbolContainer, { backgroundColor: accentColor + '22' }]}>
        <Text style={[styles.symbol, { color: accentColor }]} testID="planet-symbol">
          {symbol}
        </Text>
      </View>

      {/* Текстовая информация */}
      <View style={styles.info}>
        {/* Строка 1: «Солнце  ℞» */}
        <View style={styles.titleRow}>
          <Text
            style={[styles.planetName, { color: colors.text }]}
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
          style={[styles.position, { color: colors.textSecondary }]}
          testID="planet-position"
        >
          {`${signName} ${deg}°`}
        </Text>

        {/* Строка 3: «1-й дом» */}
        <Text
          style={[styles.house, { color: colors.textMuted }]}
          testID="planet-house"
        >
          {houseLabel(house)}
        </Text>
      </View>
    </View>
  );
};

// ─── Стили ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
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
  symbol: {
    fontSize: 24,
    lineHeight: 28,
  },
  info: { flex: 1 },
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
});
