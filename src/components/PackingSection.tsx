import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import type { PackingItem } from '@/types/packing';
import { PackingListItem } from './PackingListItem';

type PackingSectionProps = {
  title: string;
  items: PackingItem[];
  onToggle: (id: string, next: boolean) => void;
  onAddItem: (name: string) => void;
  onLongPressItem?: (item: PackingItem) => void;
};

function PackingSectionBase({
  title,
  items,
  onToggle,
  onAddItem,
  onLongPressItem,
}: PackingSectionProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const done = items.filter((i) => i.checked).length;

  const submit = () => {
    const name = draft.trim();
    if (!name) {
      setAdding(false);
      return;
    }
    onAddItem(name);
    setDraft(''); // se queda abierto para encadenar varios
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
            onToggle={() => onToggle(item.id, !item.checked)}
            onLongPress={onLongPressItem ? () => onLongPressItem(item) : undefined}
          />
        ))}

        {adding ? (
          <View style={styles.addInputRow}>
            <View style={styles.ghostCheckbox} />
            <TextInput
              style={styles.addInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="Nombre del ítem"
              placeholderTextColor={colors.secondary300}
              autoFocus
              returnKeyType="done"
              blurOnSubmit={false}
              onSubmitEditing={submit}
              onBlur={() => {
                if (!draft.trim()) setAdding(false);
              }}
            />
          </View>
        ) : (
          <Pressable style={styles.addRow} onPress={() => setAdding(true)}>
            <Text style={styles.addText}>+ Añadir equipaje</Text>
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
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  ghostCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.textSubtitle,
  },
  addInput: {
    flex: 1,
    padding: 0,
    fontFamily: fonts.sansBold,
    fontSize: fontSize.nano,
    color: colors.secondary,
  },
});
