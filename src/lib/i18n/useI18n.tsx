'use client'
import { useSyncExternalStore } from 'react'
import { getI18nStore, type Locale, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n'

export function useI18n() {
  const store = getI18nStore()
  const locale = useSyncExternalStore(store.subscribe, () => store.locale, () => DEFAULT_LOCALE as Locale)
  return { t: (key: string) => store.t(key), locale, setLocale: (l: Locale) => store.setLocale(l), supportedLocales: SUPPORTED_LOCALES }
}

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n()
  return (
    <div className="flex items-center gap-0.5 text-xs">
      {SUPPORTED_LOCALES.map(l => (
        <button key={l} onClick={() => setLocale(l)} className={`px-1.5 py-0.5 rounded font-medium ${locale === l ? 'bg-[#27698a] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
