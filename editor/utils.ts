export function notNull<T> (value: T | null | undefined): T {
  if (value === null) {
    throw new Error('Value is null.')
  }
  if (value === undefined) {
    throw new Error('Value is null.')
  }
  return value
}
