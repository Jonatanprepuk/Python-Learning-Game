import type { SnapshotValue } from '../types'

/**
 * Early levels intentionally accept either `print(expression)` or a named
 * variable as a valid solution (per the level text), so both the visuals and
 * the success checks read a numeric result the same permissive way: prefer a
 * plausibly-named variable, otherwise fall back to the last number printed.
 */
export function lastPrintedNumber(consoleLines: string[]): number | null {
  for (let i = consoleLines.length - 1; i >= 0; i--) {
    const trimmed = consoleLines[i].trim()
    const match = trimmed.match(/-?\d+(\.\d+)?\s*$/)
    if (match) return Number(match[0])
  }
  return null
}

export function pickNumeric(
  variables: Record<string, SnapshotValue> | null,
  consoleLines: string[],
  names: string[]
): number | null {
  if (variables) {
    for (const name of names) {
      const v = variables[name]
      if (typeof v === 'number') return v
    }
  }
  return lastPrintedNumber(consoleLines)
}
