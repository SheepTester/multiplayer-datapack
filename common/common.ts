export type Rearrangement = {
  type: 'create',
  key: string,
} | {
  type: 'move',
  oldKey: string,
  newKey: string,
} | {
  type: 'delete',
  key: string,
}
export function isRearrangement (value: any): value is Rearrangement {
  if (value === null || typeof value !== 'object') return false
  const { type, key, oldKey, newKey } = value
  if (type === 'create' || type === 'delete') {
    return typeof key === 'string'
  } else if (type === 'move') {
    return typeof oldKey === 'string' && typeof newKey === 'string'
  } else {
    return false
  }
}
