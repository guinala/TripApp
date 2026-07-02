import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  DIARY_MOSAIC_COLUMNS,
  DIARY_MOSAIC_GAP,
  DIARY_MOSAIC_OVERFLOW_SLOT,
  DIARY_MOSAIC_SLOTS,
  type MosaicSlot,
} from '@/constants/diary';
import { colors, fonts, fontSize, radius } from '@/constants/theme';

export type MosaicPhoto = {
  id: string;
  url: string | null; // signed URL; null mientras carga
  locationLabel?: string | null; // solo se muestra sobre la foto destacada
};

type PhotoMosaicProps = {
  photos: MosaicPhoto[];
  width: number; // ancho disponible del contenedor
  onPressPhoto?: (photo: MosaicPhoto, index: number) => void;
};

type CellRect = { left: number; top: number; width: number; height: number };

// Calcula la posición/tamaño en píxeles de cada celda a partir de su
// colSpan/rowSpan, replicando el grid-template de Figma (3 cols, gap fijo).
// La altura de fila se deriva del ancho de columna para mantener celdas
// aprox. cuadradas, igual que en el diseño original.
function layoutMosaic(slots: MosaicSlot[], containerWidth: number): CellRect[] {
  const cols = DIARY_MOSAIC_COLUMNS;
  const gap = DIARY_MOSAIC_GAP;
  const colWidth = (containerWidth - gap * (cols - 1)) / cols;
  const rowHeight = colWidth; // celdas ~cuadradas, como en el Figma

  // Ocupación de la rejilla: avanzamos celda a celda buscando el primer
  // hueco libre que pueda alojar el colSpan/rowSpan pedido (igual que
  // haría el navegador con CSS Grid auto-placement).
  const occupied = new Set<string>();
  const rects: CellRect[] = [];
  let row = 0;

  for (const slot of slots) {
    let placed = false;
    while (!placed) {
      for (let col = 0; col <= cols - slot.colSpan; col++) {
        const cells: string[] = [];
        for (let r = 0; r < slot.rowSpan; r++) {
          for (let c = 0; c < slot.colSpan; c++) {
            cells.push(`${row + r}:${col + c}`);
          }
        }
        const fits = cells.every((key) => !occupied.has(key));
        if (fits) {
          cells.forEach((key) => occupied.add(key));
          rects.push({
            left: col * (colWidth + gap),
            top: row * (rowHeight + gap),
            width: slot.colSpan * colWidth + (slot.colSpan - 1) * gap,
            height: slot.rowSpan * rowHeight + (slot.rowSpan - 1) * gap,
          });
          placed = true;
          break;
        }
      }
      if (!placed) row++;
    }
  }

  return rects;
}

export function PhotoMosaic({ photos, width, onPressPhoto }: PhotoMosaicProps) {
  const slots = useMemo<MosaicSlot[]>(
    () =>
      photos.map(
        (_, i) => DIARY_MOSAIC_SLOTS[i] ?? DIARY_MOSAIC_OVERFLOW_SLOT,
      ),
    [photos],
  );

  const rects = useMemo(() => layoutMosaic(slots, width), [slots, width]);

  const totalHeight = useMemo(
    () => rects.reduce((max, r) => Math.max(max, r.top + r.height), 0),
    [rects],
  );

  return (
    <View style={[styles.container, { width, height: totalHeight }]}>
      {photos.map((photo, i) => {
        const rect = rects[i];
        if (!rect) return null;
        const isFeatured = i === 0 && slots[0]?.colSpan === 2;

        return (
          <Pressable
            key={photo.id}
            onPress={() => onPressPhoto?.(photo, i)}
            style={[
              styles.cell,
              {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              },
            ]}
          >
            {photo.url ? (
              <Image source={{ uri: photo.url }} style={styles.image} contentFit="cover" />
            ) : (
              <View style={[styles.image, styles.placeholder]} />
            )}

            {isFeatured && photo.locationLabel ? (
              <View style={styles.locationBadge}>
                <Ionicons name="location-sharp" size={12} color={colors.surfacePaper} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {photo.locationLabel}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  cell: { position: 'absolute', borderRadius: radius.lg, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: colors.surfaceAlt },
  locationBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(28,28,28,0.84)',
    borderRadius: radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '85%',
  },
  locationText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.surfacePaper,
  },
});
