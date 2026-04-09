'use client'

import { useState, useEffect } from 'react'
import { type Locale } from './i18n'

export function useLocale(): Locale {
  // SSR 默认英文，客户端 hydration 后根据系统语言切换
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    const lang = navigator.language.toLowerCase()
    setLocale(lang.startsWith('zh') ? 'zh' : 'en')
  }, [])

  return locale
}
