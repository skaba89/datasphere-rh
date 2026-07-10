export type Locale = 'fr' | 'en'

export const DEFAULT_LOCALE: Locale = 'fr'
export const SUPPORTED_LOCALES: Locale[] = ['fr', 'en']

export function getTranslations(locale: Locale = DEFAULT_LOCALE) {
  return (key: string): string => key
}

export function createI18nStore() {
  let currentLocale: Locale = DEFAULT_LOCALE
  const listeners = new Set<() => void>()
  return {
    get locale(): Locale { return currentLocale },
    setLocale(locale: Locale) { currentLocale = locale; listeners.forEach(l => l()) },
    t(key: string): string { return key },
    subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener) },
  }
}

let i18nStore: ReturnType<typeof createI18nStore> | null = null
export function getI18nStore() {
  if (!i18nStore) i18nStore = createI18nStore()
  return i18nStore
}
