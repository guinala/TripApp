import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { DIARY_VIEWS, type DiaryView } from '@/constants/diary';

type DiaryViewSelectorProps = {
  active: DiaryView;
  onChange: (view: DiaryView) => void;
  onExportPdf?: () => void;
  exportingPdf?: boolean;
};

export function DiaryViewSelector({
  active,
  onChange,
  onExportPdf,
  exportingPdf = false,
}: DiaryViewSelectorProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <View style={styles.pills}>
        {DIARY_VIEWS.map(({ key, labelKey }) => {
          const selected = active === key;
          return (
            <Pressable
              key={key}
              onPress={() => onChange(key)}
              style={[styles.pill, selected ? styles.pillActive : styles.pillInactive]}
            >
              <Text style={[styles.label, selected ? styles.labelActive : styles.labelInactive]}>
                {t(labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={exportingPdf ? undefined : onExportPdf}
        hitSlop={8}
        style={styles.exportBtn}
      >
        {exportingPdf ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        <Text style={styles.exportText}>
          {exportingPdf ? t('diary.generating') : t('diary.exportPdf')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pills: { flexDirection: 'row', gap: spacing.s2 },
  pill: {
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    borderRadius: radius.pill,
  },
  pillActive: { backgroundColor: colors.secondaryDark },
  pillInactive: {
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.secondary100,
  },
  label: { fontFamily: fonts.sansExtraBold, fontSize: fontSize.label },
  labelActive: { color: colors.surfacePaper },
  labelInactive: { color: colors.textSecondary },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.s2 },
  exportText: { fontFamily: fonts.sansBold, fontSize: fontSize.label, color: colors.primary },
});
