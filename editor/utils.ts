export function notNull<T> (value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${value} to not be null.`)
  }
  return value
}
