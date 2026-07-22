/** Reads active attribute filters from URL search params (keys prefixed with attr_) */
export function readActiveAttributes(searchParams: URLSearchParams): Record<string, string> {
  const attrs: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key.startsWith('attr_')) attrs[key.slice(5)] = value
  })
  return attrs
}
