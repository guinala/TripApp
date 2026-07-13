import {
  NestableDraggableFlatList,
  type RenderItemParams,
} from 'react-native-reanimated-drag-list';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { dateLocale } from '@/i18n/date';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { ActivityCard } from '@/components/cards/ActivityCard';
import type { Activity } from '@/types/activity';
import type { Day } from '@/types/day';
import { Ionicons } from '@expo/vector-icons';

type DaySectionProps = {
  day: Day;
  activities: Activity[];
  onAddActivity: (dayId: string) => void;
  onReorder: (dayId: string, orderedIds: string[]) => void;
};

export function DaySection({ day, activities, onAddActivity, onReorder }: DaySectionProps) {
  const { t } = useTranslation();
  const label = t('itinerary.dayLabel', {
    number: day.dayNumber,
    date: format(parseISO(day.date), 'EEE d MMM', { locale: dateLocale() }),
  }).toUpperCase();
  const count = activities.length;

  const renderItem = ({ item }: RenderItemParams<Activity>) => (
    <View style={{ marginBottom: spacing.s2 }}>
      <ActivityCard activity={item} />
    </View>
  );

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {day.title ? <Text style={styles.title}>{day.title}</Text> : null}
      <Text style={styles.amount}>{t('itinerary.activitiesCount', { count })}</Text>

      <NestableDraggableFlatList
        data={activities}
        keyExtractor={(a) => a.id}
        renderItem={renderItem}
        estimatedItemHeight={88}
        onDragEnd={(newData) =>
          onReorder(
            day.id,
            newData.map((a) => a.id),
          )
        }
      />

      <Pressable style={styles.addBtn} onPress={() => onAddActivity(day.id)}>
        <Ionicons name="add" size={18} color={colors.primary} />
        <Text style={styles.addText}>{t('itinerary.addActivity')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing.s4, gap: spacing.s2 },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.label,
    color: colors.secondary300,
    letterSpacing: 0.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s1,
    paddingVertical: spacing.s3,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.secondary100,
    borderStyle: 'dashed',
  },
  addText: { fontFamily: fonts.sansSemiBold, fontSize: fontSize.sm, color: colors.primary },
  title: { fontFamily: fonts.serifItalic, fontSize: fontSize.title, color: colors.secondary },
  amount: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.label,
    color: colors.secondary300,
    textAlign: 'right',
  },
  cards: { gap: spacing.s2 },
});
