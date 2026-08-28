import type { SnapshotValue } from '../types'

function isClassInstance(value: SnapshotValue): value is { __class__: string; [attr: string]: SnapshotValue | string } {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && '__class__' in value
}

export function pyType(value: SnapshotValue | undefined): string {
  if (value === undefined || value === null) return 'None'
  if (typeof value === 'boolean') return 'bool'
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float'
  if (typeof value === 'string') return 'str'
  if (Array.isArray(value)) return 'list'
  if (isClassInstance(value)) return value.__class__
  return 'dict'
}

export function pyRepr(value: SnapshotValue | undefined): string {
  if (value === undefined || value === null) return 'None'
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return `"${value}"`
  if (Array.isArray(value)) return `[${value.map(pyRepr).join(', ')}]`
  if (isClassInstance(value)) {
    const { __class__, ...attrs } = value
    const inner = Object.entries(attrs)
      .map(([k, v]) => `${k}=${pyRepr(v as SnapshotValue)}`)
      .join(', ')
    return `${__class__}(${inner})`
  }
  const dict = value as Record<string, SnapshotValue>
  return `{${Object.entries(dict)
    .map(([k, v]) => `"${k}": ${pyRepr(v)}`)
    .join(', ')}}`
}

export function classAttributes(value: SnapshotValue | undefined): [string, SnapshotValue][] {
  if (!isClassInstance(value ?? null)) return []
  const { __class__: _unused, ...attrs } = value as { __class__: string; [attr: string]: SnapshotValue | string }
  return Object.entries(attrs) as [string, SnapshotValue][]
}

export function className(value: SnapshotValue | undefined): string | null {
  return value !== undefined && value !== null && isClassInstance(value) ? value.__class__ : null
}
