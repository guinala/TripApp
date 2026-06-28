import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';

const PIECES = 28;
const COLORS = [
  colors.primary,
  colors.accent,
  colors.success,
  colors.primary700,
  colors.secondary700,
];

type PieceConfig = {
  startX: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  sway: number;
  spin: number;
};

function ConfettiPiece({ cfg, height }: { cfg: PieceConfig; height: number }) {
  const fall = useSharedValue(0);

  useEffect(() => {
    fall.value = withDelay(
      cfg.delay,
      withTiming(1, { duration: cfg.duration, easing: Easing.out(Easing.quad) }),
    );
  }, [fall, cfg]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: fall.value * (height + 40) },
      { translateX: Math.sin(fall.value * Math.PI * 2) * cfg.sway },
      { rotate: `${fall.value * cfg.spin}deg` },
    ],
    opacity: 1 - fall.value * fall.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: -20,
          left: cfg.startX,
          width: cfg.size,
          height: cfg.size * 0.5,
          backgroundColor: cfg.color,
          borderRadius: 1,
        },
        style,
      ]}
    />
  );
}

export function Celebration() {
  const { width, height } = useWindowDimensions();
  const [pieces, setPieces] = useState<PieceConfig[]>([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: PIECES }, (_, i) => ({
        startX: Math.random() * width,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
        delay: Math.random() * 250,
        duration: 1800 + Math.random() * 1200,
        sway: (Math.random() - 0.5) * 120,
        spin: 360 + Math.random() * 720,
      })),
    );
  }, [width, height]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((cfg, i) => (
        <ConfettiPiece key={i} cfg={cfg} height={height} />
      ))}
    </View>
  );
}
