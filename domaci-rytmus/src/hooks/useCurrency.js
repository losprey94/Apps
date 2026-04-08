import { useLocalStorage } from './useLocalStorage'

export const CURRENCIES = [
  { code: 'EUR', label: 'Euro (€)',            locale: 'sk-SK' },
  { code: 'CZK', label: 'Česká koruna (Kč)',  locale: 'cs-CZ' },
  { code: 'PLN', label: 'Złoty (zł)',          locale: 'pl-PL' },
  { code: 'USD', label: 'US Dollar ($)',       locale: 'en-US' },
  { code: 'GBP', label: 'Pound Sterling (£)',  locale: 'en-GB' },
  { code: 'HUF', label: 'Forint (Ft)',         locale: 'hu-HU' },
  { code: 'RON', label: 'Leu (lei)',           locale: 'ro-RO' },
  { code: 'CHF', label: 'Swiss Franc (CHF)',   locale: 'de-CH' },
]

export function useCurrency() {
  const [currency] = useLocalStorage('currency', 'EUR')
  const c = CURRENCIES.find(x => x.code === currency) || CURRENCIES[0]

  const fmt = (amount, decimals = 0) =>
    new Intl.NumberFormat(c.locale, {
      style: 'currency',
      currency: c.code,
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(amount)

  return { fmt, currencyCode: c.code }
}
