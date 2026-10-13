import type { SnapshotValue } from '../types'

/** Lists are ordered; dictionaries compare keys and values, not insertion order. */
export function snapshotEqual(actual: SnapshotValue | undefined, expected: SnapshotValue): boolean {
  if (actual === expected) return true
  if (actual === null || expected === null || typeof actual !== 'object' || typeof expected !== 'object') return false
  if (Array.isArray(actual) || Array.isArray(expected)) {
    return Array.isArray(actual) && Array.isArray(expected) && actual.length === expected.length &&
      expected.every((value, index) => snapshotEqual(actual[index], value))
  }
  const keys = Object.keys(expected)
  return Object.keys(actual).length === keys.length && keys.every(key =>
    Object.prototype.hasOwnProperty.call(actual, key) && snapshotEqual(actual[key], expected[key]))
}
