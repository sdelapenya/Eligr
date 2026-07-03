export function normalizeRouteId(id: string | string[] | undefined): string | undefined {
  if (id == null) return undefined;
  return Array.isArray(id) ? id[0] : id;
}
