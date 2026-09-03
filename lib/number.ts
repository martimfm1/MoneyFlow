export function normalizeDecimalInput(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return value

  const normalized = value.trim().replace(/\s/g, '')
  if (!normalized) return normalized

  // pt-PT users commonly enter 1234,56. Preserve dot decimals for
  // keyboards/locales that emit 1234.56 and remove thousands separators.
  return normalized.includes(',')
    ? normalized.replace(/\./g, '').replace(',', '.')
    : normalized
}
