export type Rearrangements = {
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
