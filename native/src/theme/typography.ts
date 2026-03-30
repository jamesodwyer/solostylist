import { Platform, TextStyle } from 'react-native'

/**
 * Typography scale — uses system fonts for native feel.
 * San Francisco on iOS, Roboto on Android.
 */

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
})

type TypographyVariant = {
  fontSize: number
  lineHeight: number
  fontWeight: TextStyle['fontWeight']
  letterSpacing?: number
}

export const typography = {
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  bodySmMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  captionMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  button: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  buttonSm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
  },
} as const satisfies Record<string, TypographyVariant>

export { fontFamily }
