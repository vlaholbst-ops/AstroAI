// src/theme/index.ts
// TSK-64: Централизованная система тем. Палитры из ТЗ:
//   light → background #FFFFFF, text #000000
//   dark  → background #1A1A1A, text #FFFFFF
import { useColorScheme } from 'react-native';

// ─── Палитры ──────────────────────────────────────────────────────────────────

// ColorTheme — явный тип без literal-string чтобы light и dark были взаимозаменяемы
export type ColorTheme = {
  background:     string;
  text:           string;
  surface:        string;
  card:           string;
  cardBorder:     string;
  header:         string;
  headerBorder:   string;
  textSecondary:  string;
  textMuted:      string;
  placeholder:    string;
  inputBg:        string;
  inputBorder:    string;
  label:          string;
  skeleton:       string;
  skeletonCard:   string;
  debugBg:        string;
};

export const Colors: { light: ColorTheme; dark: ColorTheme } = {
  light: {
    // Основные (ТЗ)
    background:     '#FFFFFF',
    text:           '#000000',

    // Производные
    surface:        '#F3F4F6',   // фон экрана за карточками
    card:           '#FFFFFF',   // фон карточек
    cardBorder:     '#E8E8EE',
    header:         '#FFFFFF',
    headerBorder:   '#E8E8EE',

    textSecondary:  '#374151',
    textMuted:      '#9CA3AF',
    placeholder:    '#999999',

    inputBg:        '#FFFFFF',
    inputBorder:    '#DDDDDD',
    label:          '#333333',

    // Skeleton
    skeleton:       '#E5E7EB',
    skeletonCard:   '#FFFFFF',

    // Debug
    debugBg:        '#F0F0F0',
  },
  dark: {
    // Основные (ТЗ)
    background:     '#1A1A1A',
    text:           '#FFFFFF',

    // Производные
    surface:        '#0F0F1A',   // фон экрана
    card:           '#1E1E2E',   // фон карточек
    cardBorder:     '#2E2E3E',
    header:         '#1E1E2E',
    headerBorder:   '#2E2E3E',

    textSecondary:  '#D1D5DB',
    textMuted:      '#6B7280',
    placeholder:    '#6B7280',

    inputBg:        '#1E1E2E',
    inputBorder:    '#3E3E4E',
    label:          '#D1D5DB',

    // Skeleton
    skeleton:       '#2A2A3E',
    skeletonCard:   '#1E1E2E',

    // Debug
    debugBg:        '#1A1A2E',
  },
};

// ─── Хук ─────────────────────────────────────────────────────────────────────

export function useTheme(): { colors: ColorTheme; isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? Colors.dark : Colors.light, isDark };
}
