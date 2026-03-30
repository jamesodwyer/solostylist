/**
 * SoloStylist colour system — Material You inspired.
 *
 * Swap `primary` and `secondary` here to re-theme the entire app.
 * Every screen pulls from `useTheme()` so changes propagate automatically.
 */

export const palette = {
  // Brand — change these two to re-theme
  primary: '#2563EB',       // blue-600
  primaryLight: '#DBEAFE',  // blue-100
  primaryDark: '#1D4ED8',   // blue-700

  secondary: '#000000',
  secondaryLight: '#374151', // gray-700
  secondaryDark: '#000000',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Semantic
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',
} as const

export interface Theme {
  background: string
  surface: string
  surfaceElevated: string
  card: string
  text: string
  textSecondary: string
  textTertiary: string
  textInverse: string
  primary: string
  primaryLight: string
  primaryDark: string
  secondary: string
  secondaryLight: string
  border: string
  borderLight: string
  buttonPrimary: string
  buttonPrimaryText: string
  buttonSecondary: string
  buttonSecondaryText: string
  buttonDisabled: string
  buttonDisabledText: string
  tabActive: string
  tabInactive: string
  tabBackground: string
  tabBorder: string
  inputBackground: string
  inputBorder: string
  inputBorderFocus: string
  inputText: string
  inputPlaceholder: string
  success: string
  successLight: string
  warning: string
  warningLight: string
  error: string
  errorLight: string
  overlay: string
  shadow: string
}

export const lightTheme: Theme = {
  // Surfaces
  background: palette.white,
  surface: palette.gray50,
  surfaceElevated: palette.white,
  card: palette.white,

  // Text
  text: palette.gray900,
  textSecondary: palette.gray500,
  textTertiary: palette.gray400,
  textInverse: palette.white,

  // Brand
  primary: palette.primary,
  primaryLight: palette.primaryLight,
  primaryDark: palette.primaryDark,
  secondary: palette.secondary,
  secondaryLight: palette.secondaryLight,

  // Borders
  border: palette.gray200,
  borderLight: palette.gray100,

  // Interactive
  buttonPrimary: palette.primary,
  buttonPrimaryText: palette.white,
  buttonSecondary: palette.gray100,
  buttonSecondaryText: palette.gray900,
  buttonDisabled: palette.gray200,
  buttonDisabledText: palette.gray400,

  // Tab bar
  tabActive: palette.primary,
  tabInactive: palette.gray400,
  tabBackground: palette.white,
  tabBorder: palette.gray200,

  // Input
  inputBackground: palette.white,
  inputBorder: palette.gray300,
  inputBorderFocus: palette.primary,
  inputText: palette.gray900,
  inputPlaceholder: palette.gray400,

  // Status
  success: palette.success,
  successLight: palette.successLight,
  warning: palette.warning,
  warningLight: palette.warningLight,
  error: palette.error,
  errorLight: palette.errorLight,

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.08)',
}

export const darkTheme: Theme = {
  background: palette.gray900,
  surface: palette.gray800,
  surfaceElevated: palette.gray700,
  card: palette.gray800,

  text: palette.gray50,
  textSecondary: palette.gray400,
  textTertiary: palette.gray500,
  textInverse: palette.gray900,

  primary: palette.primary,
  primaryLight: '#1E3A5F',
  primaryDark: '#3B82F6',
  secondary: palette.white,
  secondaryLight: palette.gray400,

  border: palette.gray700,
  borderLight: palette.gray800,

  buttonPrimary: palette.primary,
  buttonPrimaryText: palette.white,
  buttonSecondary: palette.gray700,
  buttonSecondaryText: palette.gray50,
  buttonDisabled: palette.gray700,
  buttonDisabledText: palette.gray500,

  tabActive: palette.primary,
  tabInactive: palette.gray500,
  tabBackground: palette.gray900,
  tabBorder: palette.gray700,

  inputBackground: palette.gray800,
  inputBorder: palette.gray600,
  inputBorderFocus: palette.primary,
  inputText: palette.gray50,
  inputPlaceholder: palette.gray500,

  success: '#22C55E',
  successLight: '#14532D',
  warning: '#F59E0B',
  warningLight: '#78350F',
  error: '#EF4444',
  errorLight: '#7F1D1D',

  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',
}
