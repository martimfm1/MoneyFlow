export type MoneyFlowLocale = 'pt-PT' | 'en'

const DEFAULT_LOCALE: MoneyFlowLocale = 'pt-PT'
const DEFAULT_CURRENCY = 'EUR'

function resolveLocale(locale?: MoneyFlowLocale) {
  return locale ?? DEFAULT_LOCALE
}

export function formatCurrency(
  value: number,
  currency = DEFAULT_CURRENCY,
  locale?: MoneyFlowLocale,
) {
  return new Intl.NumberFormat(resolveLocale(locale), {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number, locale?: MoneyFlowLocale) {
  return new Intl.NumberFormat(resolveLocale(locale), {
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(
  value: string | number | Date,
  locale?: MoneyFlowLocale,
) {
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function formatMonth(
  value: string | number | Date,
  locale?: MoneyFlowLocale,
) {
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}
