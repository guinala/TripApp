import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { dateLocale } from '@/i18n/date';
import type { Day } from '@/types/day';

type DayPickerModalProps = {
  visible: boolean;
  days: Day[];
  suggestedDate?: string | null;
  onSelectDay: (dayId: string) => void;
  onClose: () => void;
};

export function DayPickerModal({
  visible,
  days,
  suggestedDate,
  onSelectDay,
  onClose,
}: DayPickerModalProps) {
  const { t } = useTranslation();

  const suggestedYmd = suggestedDate
    ? (() => {
        try {
          return format(parseISO(suggestedDate), 'yyyy-MM-dd');
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>{t('diary.chooseDayTitle')}</Text>
              <Text style={styles.subtitle}>{t('diary.chooseDayMessage')}</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Ionicons name="close" size={22} color={colors.secondary300} />
            </Pressable>
          </View>

          <FlatList
            data={days}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            renderItem={({ item }) => {
              const isSuggested = suggestedYmd === item.date;
              const formattedDate = format(parseISO(item.date), 'EEEE, d MMMM', {
                locale: dateLocale(),
              });

              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.dayItem,
                    isSuggested && styles.dayItemSuggested,
                    pressed && styles.dayItemPressed,
                  ]}
                  onPress={() => onSelectDay(item.id)}
                >
                  <View style={styles.dayItemContent}>
                    <View style={styles.dayTopRow}>
                      <Text style={[styles.dayNumber, isSuggested && styles.dayNumberSuggested]}>
                        {t('itinerary.dayNumber', { number: item.dayNumber })}
                      </Text>
                      {item.title ? (
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          · {item.title}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.dayDate}>
                      {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
                    </Text>
                  </View>

                  <View style={styles.rightAction}>
                    {isSuggested ? (
                      <View style={styles.suggestedBadge}>
                        <Ionicons name="sparkles" size={13} color={colors.primary} />
                        <Text style={styles.suggestedBadgeText}>
                          {t('diary.photoDateMatch', 'Fecha foto')}
                        </Text>
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={colors.secondary100} />
                    )}
                  </View>
                </Pressable>
              );
            }}
          />

          <SafeAreaView edges={['bottom']}>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 51, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfacePaper,
    borderTopLeftRadius: radius.xl2,
    borderTopRightRadius: radius.xl2,
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s5,
    paddingBottom: spacing.s3,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: spacing.s4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceAlt,
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: spacing.s3,
    gap: spacing.s1,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.title,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: spacing.s1,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  listContent: {
    paddingVertical: spacing.s2,
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s4,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.md,
    marginVertical: 2,
  },
  dayItemSuggested: {
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: colors.primary100,
  },
  dayItemPressed: {
    backgroundColor: colors.surfaceCream,
  },
  dayItemContent: {
    flex: 1,
    gap: 3,
  },
  dayTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
  },
  dayNumber: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  dayNumberSuggested: {
    color: colors.primary,
    fontFamily: fonts.sansBold,
  },
  itemTitle: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  dayDate: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.sm,
    color: colors.textMetadata,
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.s3,
  },
  suggestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary100,
    paddingHorizontal: spacing.s3,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  suggestedBadgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.micro,
    color: colors.primary700,
  },
  cancelButton: {
    marginTop: spacing.s3,
    paddingVertical: spacing.s3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  cancelButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
});
