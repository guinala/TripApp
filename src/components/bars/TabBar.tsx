import { colors, fonts, fontSize, radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_META: Record<string, { labelKey: string; icon: IconName }> = {
  index: { labelKey: 'tabs.trips', icon: 'briefcase' },
  explore: { labelKey: 'tabs.explore', icon: 'compass' },
  profile: { labelKey: 'tabs.profile', icon: 'person' },
};

export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom || 12 }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name];
          if (!meta) return null;
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const tint = focused ? colors.primary50 : colors.textSecondary;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tab, focused && styles.tabActive]}
            >
              <Ionicons name={meta.icon} size={20} color={tint} />
              <Text style={[styles.label, { color: tint }]}>{t(meta.labelKey)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfacePaper,
    borderRadius: radius.xl2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 2,
    elevation: 4, // sombra en Android
  },
  tab: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  tabActive: { backgroundColor: colors.primary },
  label: { fontFamily: fonts.sansBold, fontSize: fontSize.label },
});
