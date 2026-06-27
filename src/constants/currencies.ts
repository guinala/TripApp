import { SelectOption } from '@/components/ui/SelectField';

export const CURRENCY_OPTIONS: SelectOption[] = [
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'MXN ($)', value: 'MXN' },
  { label: 'ARS ($)', value: 'ARS' },
  { label: 'JPY (¥)', value: 'JPY' },
];

export const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  MXN: '$',
  ARS: '$',
  JPY: '¥',
};
