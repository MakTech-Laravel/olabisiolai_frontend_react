import * as React from 'react'

import { loadFavicon } from '@/utils/favicon'

type UseFaviconOptions = {
  apiUrl?: string
  responsePath?: string
  ttlMs?: number
}

export function useFavicon(options: UseFaviconOptions = {}) {
  const apiUrl = options.apiUrl
  const responsePath = options.responsePath
  const ttlMs = options.ttlMs

  React.useEffect(() => {
    void loadFavicon({ apiUrl, responsePath, ttlMs })
  }, [apiUrl, responsePath, ttlMs])
}

