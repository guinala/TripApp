import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import World from '@svg-maps/world';
import { colors } from '@/constants/theme';

type VisitedCountriesMapProps = {
  visited: string[];
  height?: number;
};

export function VisitedCountriesMap({ visited, height = 158 }: VisitedCountriesMapProps) {
  const visitedSet = useMemo(() => new Set(visited.map((c) => c.toLowerCase())), [visited]);

  return (
    <View style={[styles.card, { height }]}>
      <Svg width="100%" height="100%" viewBox={World.viewBox} preserveAspectRatio="xMidYMid meet">
        {World.locations.map((loc) => (
          <Path
            key={loc.id}
            d={loc.path}
            fill={visitedSet.has(loc.id) ? colors.primary : colors.secondary100}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surfacePaper,
    borderRadius: 22,
    overflow: 'hidden',
    paddingVertical: 8,
  },
});
