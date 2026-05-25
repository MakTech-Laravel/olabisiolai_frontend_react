import * as React from 'react'

export function useClipboard(timeoutMs = 1200) {
  const [copied, setCopied] = React.useState(false)

  const copy = React.useCallback(
    async (text: string) => {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), timeoutMs)
    },
    [timeoutMs],
  )

  return { copied, copy }
}

