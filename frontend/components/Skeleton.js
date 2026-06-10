import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

/**
 * A single pulsing placeholder block. Composable into any layout.
 */
export function SkeletonBox({ width = "100%", height = 16, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 650, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: "#1C1C1E" }, style, { opacity }]}
    />
  );
}

/**
 * Round placeholder — for progress rings, avatars, icon badges.
 */
export function SkeletonCircle({ size = 90, style }) {
  return <SkeletonBox width={size} height={size} borderRadius={size / 2} style={style} />;
}

/**
 * A vertical stack of card-shaped placeholders. Used for list screens
 * (saved plans, notifications, videos, meals) while data loads.
 */
export function SkeletonList({ count = 4, height = 80, borderRadius = 16, gap = 12, style }) {
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBox key={i} height={height} borderRadius={borderRadius} />
      ))}
    </View>
  );
}
