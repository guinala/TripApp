import { ExpenseCategory } from '@/types/expense';

export const colors = {
  // Primary
  primary: '#e26d4f',
  primary700: '#c85738',
  primary100: '#fbe8df',
  primary50: '#fdf4ef',
  // Secundary
  secondary: '#1b2d4f',
  secondaryDark: '#0f1b33',
  secondary700: '#2e4373',
  secondary300: '#6b7a99',
  secondary100: '#dce3f0',
  //Accent
  accent: '#e8b547',
  accent100: '#fff4d4',
  // Surface
  surfacePaper: '#fffcf7',
  surfaceCream: '#fbf2ea',
  surfaceAlt: '#f4efe5',
  // Accent
  textPrimary: '#1b2d4f',
  textSecondary: '#4f5f7e',
  textMetadata: '#8a95ac',
  textSubtitle: '#d9d9d9',
  // States
  success: '#2d7a55',
  warning: '#e8b547',
  danger: '#c84a2e',
  // Misc
  white: '#ffffff',
  cardBorder: '#D9D9D9',
  ink: '#1B2D4F',
} as const;

export const categoryColors = {
  visit: '#e26d4f',
  restaurant: '#c99422',
  transport: '#1b2d4f',
  hotel: '#2d7a55',
  entertainment: '#8b5cb8',
  others: '#6b7a99',
} as const;

export const expenseCategoryColors: Record<ExpenseCategory, string> = {
  transport: categoryColors.transport,
  food: categoryColors.restaurant,
  stay: categoryColors.hotel,
  leisure: categoryColors.entertainment,
  other: categoryColors.others,
};

export const remainingColor = colors.textMetadata;

export const fontSize = {
  nano: 10,
  micro: 11,
  label: 12,
  sm: 13,
  body: 14,
  base: 15,
  input: 17,
  title: 22,
  textSm: 30,
  textMd: 40,
  text2xl: 96,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xl2: 22,
  pill: 999,
} as const;

export const spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 14,
  s5: 16,
  s6: 18,
  s7: 22,
  s8: 28,
  s10: 40,
} as const;

export const fonts = {
  sansRegular: 'PlusJakartaSans-Regular', // 400
  sansMedium: 'PlusJakartaSans-Medium', // 500
  sansSemiBold: 'PlusJakartaSans-SemiBold', // 600
  sansBold: 'PlusJakartaSans-Bold', // 700
  sansExtraBold: 'PlusJakartaSans-ExtraBold', // 800
  serif: 'InstrumentSerif-Regular',
  serifItalic: 'InstrumentSerif-Italic',
  mono: 'JetBrainsMono-Regular',
} as const;

export const onboarding = {
  overlayTop: 'rgba(226, 109, 79, 0.67)',
  overlayBottom: 'rgba(113, 37, 37, 0.9)',
  gold: '#ffdb8f',
  muted: '#d0c8c8',
  cta: '#ff5a14',
} as const;
