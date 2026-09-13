import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';

export type PickerOption = {
  label: string;
  value: string;
  subtitle?: string;
};

type OptionPickerModalProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: PickerOption[];
  selectedValue?: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
};

export function OptionPickerModal({
  visible,
  title,
  subtitle,
  options,
  selectedValue,
  onSelect,
  onClose,
}: OptionPickerModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Ionicons name="close" size={20} color={colors.secondary300} />
            </Pressable>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            renderItem={({ item }) => {
              const isSelected = item.value === selectedValue;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.optionItem,
                    isSelected && styles.optionItemSelected,
                    pressed && styles.optionItemPressed,
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    onClose();
                  }}
                >
                  <View style={styles.optionTextContainer}>
                    <Text
                      style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {item.subtitle ? (
                      <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
                    ) : null}
                  </View>

                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  ) : null}
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
    maxHeight: '65%',
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
    paddingBottom: spacing.s3,
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
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s4,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.md,
    marginVertical: 2,
  },
  optionItemSelected: {
    backgroundColor: colors.primary50,
  },
  optionItemPressed: {
    backgroundColor: colors.surfaceCream,
  },
  optionTextContainer: {
    flex: 1,
    paddingRight: spacing.s3,
  },
  optionLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  optionLabelSelected: {
    fontFamily: fonts.sansBold,
    color: colors.primary,
  },
  optionSubtitle: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.sm,
    color: colors.textMetadata,
    marginTop: 2,
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
