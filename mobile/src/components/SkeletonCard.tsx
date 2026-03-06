// src/components/SkeletonCard.tsx
// TSK-64: Skeleton-placeholder для PlanetCard пока loading=true.
// Пульсирующая анимация shimmer (opacity 0.3 ↔ 1).
// Тема берётся из useTheme() — isDark prop больше не нужен.
import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export const SkeletonCard: React.FC = () => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.skeletonCard,
          borderColor: colors.cardBorder,
          opacity,
        },
      ]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {/* Круглый placeholder для символа планеты */}
      <View style={[styles.circle, { backgroundColor: colors.skeleton }]} />

      {/* Три строки текста */}
      <View style={styles.lines}>
        <View style={[styles.lineLong,   { backgroundColor: colors.skeleton }]} />
        <View style={[styles.lineMedium, { backgroundColor: colors.skeleton }]} />
        <View style={[styles.lineShort,  { backgroundColor: colors.skeleton }]} />
      </View>
    </Animated.View>
  );
};

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
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
  },
  lines: {
    flex: 1,
    gap: 6,
  },
  lineLong: {
    height: 14,
    borderRadius: 7,
    width: '70%',
  },
  lineMedium: {
    height: 12,
    borderRadius: 6,
    width: '50%',
  },
  lineShort: {
    height: 10,
    borderRadius: 5,
    width: '30%',
  },
});
