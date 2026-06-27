import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/constants/theme';

const SIZE = 60;
const STROKE = 7;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

type PackingProgressRingProps = { done: number; total: number };

export function PackingProgressRing({ done, total }: PackingProgressRingProps) {
  const fraction = total > 0 ? Math.min(done / total, 1) : 0;
  const dash = C * fraction;
  const center = SIZE / 2;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={center}
          cy={center}
          r={R}
          stroke={colors.secondary300}
          strokeWidth={STROKE}
          fill="none"
        />
        {fraction > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={R}
            stroke={colors.primary}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${dash} ${C - dash}`}
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE },
});
