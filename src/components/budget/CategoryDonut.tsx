// src/components/budget/CategoryDonut.tsx
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import type { DonutSegment } from '@/hooks/use-budget-summary';
import { expenseCategoryColors, remainingColor } from '@/constants/theme';

type CategoryDonutProps = {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
};

function colorFor(key: DonutSegment['key']): string {
  return key === 'remaining' ? remainingColor : expenseCategoryColors[key];
}

export function CategoryDonut({ segments, size = 60, strokeWidth = 12 }: CategoryDonutProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const arcs = useMemo(() => {
    const total = segments.reduce((sum, s) => sum + s.percentage, 0);
    if (total <= 0) return [];

    let offsetAcc = 0;
    return segments.map((seg) => {
      const fraction = seg.percentage / total;
      const dash = fraction * circumference;
      const arc = {
        key: seg.key,
        color: colorFor(seg.key),
        dashArray: `${dash} ${circumference - dash}`,
        dashOffset: -offsetAcc, // Sentido horario
      };
      offsetAcc += dash;
      return arc;
    });
  }, [segments, circumference]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          {arcs.map((arc) => (
            <Circle
              key={arc.key}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.dashOffset}
              strokeLinecap="butt"
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}
