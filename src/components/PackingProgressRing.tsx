import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 60;
const STROKE = 7;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const CENTER = SIZE / 2;

type PackingProgressRingProps = { done: number; total: number };

export function PackingProgressRing({ done, total }: PackingProgressRingProps) {
  const fraction = total > 0 ? Math.min(done / total, 1) : 0;
  const progress = useSharedValue(fraction);

  useEffect(() => {
    progress.value = withTiming(fraction, { duration: 450, easing: Easing.out(Easing.cubic) });
  }, [fraction, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: C * (1 - progress.value),
  }));

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={R}
          stroke={colors.secondary300}
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={CENTER}
          cy={CENTER}
          r={R}
          stroke={colors.primary}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={C}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE },
});
