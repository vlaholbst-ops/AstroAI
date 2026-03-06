// src/components/SkeletonCard.tsx
// Анимированный skeleton-placeholder для PlanetCard пока loading=true
import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

interface SkeletonCardProps {
  isDark?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ isDark = false }) => {
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

  const shimmer = isDark ? '#2A2A3E' : '#E5E7EB';
  const cardBg  = isDark ? '#1E1E2E' : '#FFFFFF';
  const border  = isDark ? '#2E2E3E' : '#E8E8EE';

  return (
    <Animated.View
      style={[styles.card, { backgroundColor: cardBg, borderColor: border, opacity }]}
    >
      {/* Круглый placeholder для символа */}
      <View style={[styles.circle, { backgroundColor: shimmer }]} />

      {/* Три строки текста */}
      <View style={styles.lines}>
        <View style={[styles.lineLong,   { backgroundColor: shimmer }]} />
        <View style={[styles.lineMedium, { backgroundColor: shimmer }]} />
        <View style={[styles.lineShort,  { backgroundColor: shimmer }]} />
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
