/**
 * Shortcut for document.getElementById.
 *
 * @param id element ID.
 * @returns document.getElementById return value.
 */
export function byId(id: string): HTMLElement {
  return document.getElementById(id)!;
}
