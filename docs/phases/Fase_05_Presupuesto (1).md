# Fase 5 — Presupuesto

## Objetivo

Registrar gastos del viaje en múltiples divisas, convertirlos automáticamente a la moneda del viaje, visualizar la distribución con gráficos, y avisar cuando se supere el 80% del presupuesto.

## Prerrequisitos

- Fase 4 completada (TabView funcional dentro de TripDetailScreen).

## Tareas

### 5.1 Modelo Expense + servicio

`src/types/expense.ts`:
```typescript
export type ExpenseCategory = 'transport' | 'food' | 'stay' | 'leisure' | 'other';

export interface Expense {
  id: string;
  tripId: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string | null;
  date: string;       // ISO date
  createdAt: string;
}
```

`src/services/expenses.ts`:
- `listExpenses(tripId)`
- `createExpense(data)`
- `updateExpense(id, data)`
- `deleteExpense(id)`

### 5.2 Conversión de divisas

API recomendada: **[frankfurter.app](https://frankfurter.app)** — gratis, sin API key, sin límites razonables, datos del BCE.

```
GET https://api.frankfurter.app/latest?from=USD&to=EUR
→ { "amount": 1, "base": "USD", "date": "...", "rates": { "EUR": 0.92 } }
```

`src/services/exchangeRates.ts`:
- `getRate(from: string, to: string)` → `Promise<number>`
- Cachear en memoria con TTL de 1 hora (los tipos no cambian tan rápido).
- Si la API falla, devolver `1` y mostrar warning (no romper la app).

`src/utils/currency.ts`:
- `convert(amount: number, from: string, to: string): Promise<number>`
- `formatCurrency(amount: number, currency: string, locale = 'es-ES'): string`
  - Usa `Intl.NumberFormat` para formatear: `1.234,56 €`.

### 5.3 Pantalla de Presupuesto

`app/(app)/trips/[id]/budget.tsx`:

Layout vertical:
1. **Resumen** arriba: gastado / presupuesto + barra de progreso.
2. **Gráficos** en medio: pie chart por categoría + bar chart por día.
3. **Lista de gastos** abajo: scroll infinito o paginación.
4. **FAB** "+ Gasto" abajo a la derecha.

### 5.4 Resumen y barra de progreso

`src/components/BudgetSummary.tsx`:
- Cantidad total gastada (en moneda del viaje).
- Cantidad del presupuesto.
- Barra de progreso con color:
  - 0-60% → verde.
  - 60-80% → amarillo.
  - 80-100% → naranja con texto "Te queda poco margen".
  - > 100% → rojo con texto "Has superado el presupuesto en X".

```tsx
const percentage = (spent / budget) * 100;
const color = 
  percentage > 100 ? 'red' :
  percentage > 80 ? 'orange' :
  percentage > 60 ? 'yellow' : 'green';
```

### 5.5 Gráfico circular por categoría

Con `react-native-chart-kit`:

```tsx
import { PieChart } from 'react-native-chart-kit';

const data = [
  { name: 'Transporte', amount: 450, color: '#FF6B6B', legendFontColor: '#333' },
  { name: 'Comida',     amount: 320, color: '#4ECDC4', legendFontColor: '#333' },
  // ...
];

<PieChart
  data={data}
  width={screenWidth}
  height={200}
  chartConfig={chartConfig}
  accessor="amount"
  backgroundColor="transparent"
  paddingLeft="15"
/>
```

Colores por categoría (constantes en `src/constants/colors.ts`):
- transport → rojo
- food → turquesa
- stay → azul
- leisure → morado
- other → gris

### 5.6 Gráfico de barras por día

`BarChart` con eje X = días del viaje, eje Y = total gastado ese día. Útil para detectar días "caros".

### 5.7 Formulario de gasto (modal)

`app/(app)/trips/[id]/expense/new.tsx` — registrarla en el layout del detalle como modal:

```tsx
// En app/(app)/trips/[id]/_layout.tsx, si usamos un Stack en vez del MaterialTopTabs
// para presentar modales sobre las tabs, se complica. Alternativa simple:
// el modal se registra a nivel de (app)/_layout y se invoca con
// router.push(`/trips/${id}/expense/new`).
```

Campos:
- **Cantidad** — input numérico, teclado decimal.
- **Moneda** — selector con monedas comunes. Por defecto la del viaje.
- **Categoría** — picker con 5 opciones e iconos.
- **Descripción** — texto corto.
- **Fecha** — date picker. Por defecto: hoy.

Al guardar, si la moneda es distinta a la del viaje, **se guarda la cantidad y moneda originales tal cual**. La conversión se hace al sumar para mostrar totales, no al guardar. Así:
- Si los tipos de cambio cambian, los importes históricos se mantienen exactos.
- Mostramos al usuario "Pagué 50 USD" en vez de un valor convertido aproximado.

### 5.8 Lista de gastos

`src/components/ExpenseList.tsx`:
- Agrupados por fecha (secciones).
- Cada item: icono de categoría, descripción, cantidad original + equivalente en moneda viaje entre paréntesis si difiere.
- Swipe → eliminar.
- Tap → editar.

Ejemplo de visualización:
```
🍕 Cena en la trattoria
   45,00 USD (≈ 41,40 €)
```

### 5.9 Cálculo del total convertido

`src/utils/calculateTotal.ts`:

```typescript
async function calculateTotalInCurrency(
  expenses: Expense[],
  targetCurrency: string
): Promise<number> {
  let total = 0;
  for (const e of expenses) {
    if (e.currency === targetCurrency) {
      total += e.amount;
    } else {
      total += await convert(e.amount, e.currency, targetCurrency);
    }
  }
  return total;
}
```

Optimización: agrupar gastos por moneda y hacer una sola llamada de conversión por par.

### 5.10 Alerta al superar el 80%

Cuando el porcentaje cruza el 80%, mostrar un Toast/banner la primera vez. Guardar en AsyncStorage qué viajes ya han mostrado la alerta para no repetir.

---

## Decisiones técnicas

1. **Guardar cantidades originales, no convertidas** — preserva la fidelidad histórica y permite recalcular si los tipos cambian.
2. **API externa para tipos de cambio** — alternativa: tabla local actualizada periódicamente. La API es más simple y no necesita mantenimiento.
3. **Caché de tipos en memoria** — TTL 1h. Para offline, se podría guardar en AsyncStorage; lo veremos en Fase 10.
4. **Colores por categoría centralizados** — `src/constants/colors.ts` para reutilizar en gráficos, iconos y badges.

---

## Verificación / Definition of Done

- [ ] Crear un gasto en una moneda distinta a la del viaje y verificar que se muestra convertido correctamente.
- [ ] El pie chart refleja la distribución correcta por categoría.
- [ ] La barra de progreso cambia de color según el porcentaje gastado.
- [ ] Al pasar del 80%, salta una alerta (solo la primera vez).
- [ ] Eliminar un gasto recalcula totales y gráficos al instante.
- [ ] Si la API de tipos de cambio falla, la app no crashea; muestra los importes con un warning.

## Siguiente fase

→ [Fase 6 — Checklist de equipaje](./Fase_06_Checklist_equipaje.md)
