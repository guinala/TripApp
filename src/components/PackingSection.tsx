import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import type { PackingItem } from '@/types/packing';
import { PackingListItem } from './PackingListItem';

type PackingSectionProps = {
  title: string;
  items: PackingItem[];
  onToggle: (id: string, next: boolean) => void;
  onAddItem: (name: string) => void;
  onLongPressItem?: (item: PackingItem) => void;
  editingId?: string | null;
  onSubmitEdit?: (id: string, name: string) => void;
  onCancelEdit?: () => void;
};

function PackingSectionBase({
  title,
  items,
  onToggle,
  onAddItem,
  onLongPressItem,
  editingId,
  onSubmitEdit,
  onCancelEdit,
}: PackingSectionProps) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState('');
  const done = items.filter((i) => i.checked).length;

  const close = () => {
    setAdding(false);
    setValue('');
  };

  const submit = () => {
    const name = value.trim();
    if (name) {
      onAddItem(name);
      setValue('');
    }
  };

  const blur = () => {
    const name = value.trim();
    if (name) onAddItem(name);
    close();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.counter}>
          {done}/{items.length}
        </Text>
      </View>

      <View style={styles.card}>
        {items.map((item) => (
          <PackingListItem
            key={item.id}
            name={item.name}
            checked={item.checked}
            editing={editingId === item.id}
            onToggle={() => onToggle(item.id, !item.checked)}
            onLongPress={onLongPressItem ? () => onLongPressItem(item) : undefined}
            onSubmitEdit={(name) => onSubmitEdit?.(item.id, name)}
            onCancelEdit={onCancelEdit}
          />
        ))}

        {adding ? (
          <View style={styles.inputRow}>
            <View style={styles.inputCheckbox} />
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              placeholder={t('packing.itemPlaceholder')}
              placeholderTextColor={colors.secondary300}
              autoFocus
              returnKeyType="done"
              blurOnSubmit={false}
              onSubmitEditing={submit}
              onBlur={blur}
            />
          </View>
        ) : (
          <Pressable style={styles.addRow} onPress={() => setAdding(true)}>
            <Text style={styles.addText}>{t('packing.addItem')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export const PackingSection = memo(PackingSectionBase);

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.title,
    color: colors.secondary,
  },
  counter: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.nano,
    color: colors.secondary300,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: colors.surfacePaper,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  addRow: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  addText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.nano,
    color: colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  inputCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.textSubtitle,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sansBold,
    fontSize: fontSize.body,
    color: colors.secondary,
    padding: 0,
  },
});
