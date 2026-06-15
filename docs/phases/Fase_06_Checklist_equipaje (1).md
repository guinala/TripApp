# Fase 6 — Checklist de equipaje

## Objetivo

Permitir al usuario gestionar una lista de cosas a llevar al viaje, agrupada por categorías, con plantillas predeterminadas y opción de duplicar checklists de viajes anteriores.

## Prerrequisitos

- Fase 5 completada.

## Tareas

### 6.1 Modelo PackingItem + servicio

`src/types/packing.ts`:
```typescript
export type PackingCategory = 'docs' | 'clothes' | 'tech' | 'hygiene' | 'other';

export interface PackingItem {
  id: string;
  tripId: string;
  name: string;
  category: PackingCategory;
  checked: boolean;
}
```

`src/services/packing.ts`:
- `listItems(tripId)`
- `createItem(data)`
- `toggleItem(id, checked)`
- `updateItem(id, data)`
- `deleteItem(id)`
- `bulkInsert(tripId, items)` — para plantillas y duplicación.

### 6.2 Pantalla de Equipaje

`app/(app)/trips/[id]/packing.tsx`:

Layout:
1. **Cabecera** con contador "12/18 preparados" y barra de progreso pequeña.
2. **Lista** agrupada por categoría (`SectionList`).
3. Cada sección: cabecera con nombre categoría + icono + contador parcial.
4. Cada ítem: checkbox + nombre. Tap en cualquier parte → toggle.
5. **Botón flotante "+"** para añadir ítem rápido.
6. **Menú de acciones** (icono 3 puntos arriba): "Cargar plantilla", "Duplicar de otro viaje", "Vaciar lista".

### 6.3 Componente PackingListItem

`src/components/PackingListItem.tsx`:
- Checkbox custom con animación al togglear (Reanimated).
- Nombre del ítem tachado si `checked = true`.
- Long-press → opciones de editar/eliminar.
- Tap → toggle.

### 6.4 Añadir ítem rápido

Input inline al final de cada sección o un modal pequeño con:
- Nombre del ítem.
- Selector de categoría.

Optimistic update: el ítem aparece marcado como "guardando..." mientras se sube, y se confirma al volver Supabase con éxito.

### 6.5 Plantillas predeterminadas

`src/constants/packingTemplates.ts`:

```typescript
export const PACKING_TEMPLATES = {
  beach: {
    name: 'Playa',
    items: [
      { name: 'Bañador', category: 'clothes' },
      { name: 'Toalla', category: 'other' },
      { name: 'Crema solar', category: 'hygiene' },
      { name: 'Gafas de sol', category: 'other' },
      { name: 'Chanclas', category: 'clothes' },
      // ...
    ],
  },
  mountain: {
    name: 'Montaña',
    items: [
      { name: 'Botas de trekking', category: 'clothes' },
      { name: 'Cortavientos', category: 'clothes' },
      { name: 'Linterna frontal', category: 'tech' },
      { name: 'Botiquín', category: 'other' },
      // ...
    ],
  },
  city: {
    name: 'Ciudad',
    items: [
      { name: 'Zapatillas cómodas', category: 'clothes' },
      { name: 'Mochila pequeña', category: 'other' },
      { name: 'Power bank', category: 'tech' },
      // ...
    ],
  },
  business: {
    name: 'Negocios',
    items: [
      { name: 'Traje', category: 'clothes' },
      { name: 'Camisas planchadas', category: 'clothes' },
      { name: 'Portátil', category: 'tech' },
      { name: 'Cargador portátil', category: 'tech' },
      // ...
    ],
  },
  common: {
    name: 'Básicos (siempre)',
    items: [
      { name: 'DNI / Pasaporte', category: 'docs' },
      { name: 'Tarjeta de crédito', category: 'docs' },
      { name: 'Cargador móvil', category: 'tech' },
      { name: 'Cepillo de dientes', category: 'hygiene' },
      { name: 'Ropa interior', category: 'clothes' },
      // ...
    ],
  },
};
```

Modal de plantillas:
- Lista las plantillas disponibles.
- Multiselección (puedes aplicar "ciudad" + "básicos").
- Comportamiento:
  - Si la lista está vacía → inserta los ítems directamente.
  - Si ya tiene ítems → preguntar "¿Añadir o reemplazar?".

### 6.6 Duplicar de otro viaje

Modal con dropdown de viajes previos del usuario. Al seleccionar uno:
- Carga sus ítems.
- Inserta una copia en el viaje actual con `checked = false` (empezamos de cero).

### 6.7 Animación al marcar todos los ítems

Pequeña gratificación visual: cuando el último ítem se marca y el progreso llega al 100%, animar la barra y mostrar confetti (`react-native-confetti-cannon` u opción ligera con Reanimated).

---

## Decisiones técnicas

1. **`SectionList` en lugar de FlatList** — el agrupado por categoría se hace nativamente sin trampas con `sections`.
2. **Plantillas en código, no en BD** — son contenido estático que no cambia por usuario. Si quisiéramos que el usuario creara sus propias plantillas, habría que añadir tabla; lo dejamos para futuras versiones.
3. **Optimistic updates** — para que el toggle del checkbox sea instantáneo. Si la BD falla, revertimos.
4. **Duplicación con `checked = false`** — el usuario va a re-preparar las cosas para este viaje, no asumimos que ya las tiene.

---

## Verificación / Definition of Done

- [ ] Aplicar plantilla "Ciudad" llena la lista con sus ítems.
- [ ] Marcar/desmarcar ítems actualiza el contador en la cabecera.
- [ ] Añadir un ítem custom funciona y persiste.
- [ ] Duplicar de un viaje anterior trae todos los ítems sin marcar.
- [ ] La animación de confetti se dispara al marcar el último ítem.
- [ ] El estado se mantiene tras cerrar y reabrir la app.

## Siguiente fase

→ [Fase 7 — Diario de fotos](./Fase_07_Diario_fotos.md)
