// Minimal react-native mock for Jest (Node environment)
export const Platform = {
  OS: 'ios' as const,
  select: (obj: Record<string, unknown>) => obj.ios ?? obj.default,
}
