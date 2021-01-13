export function randomId () {
  return Date.now().toString(36) + Math.random().toString(36)
}
