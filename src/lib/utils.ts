import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format integer pennies to £ string. E.g. 1500 → "£15.00" */
export function formatPrice(pennies: number): string {
  return `£${(pennies / 100).toFixed(2)}`
}

/** Parse a decimal string to integer pennies. E.g. "15.00" → 1500 */
export function parsePriceToPennies(input: string): number {
  const value = parseFloat(input)
  if (isNaN(value)) return 0
  return Math.round(value * 100)
}
