import * as React from 'react'

export function useNav(initialOpen = false) {
  const [open, setOpen] = React.useState(initialOpen)
  const openNav = React.useCallback(() => setOpen(true), [])
  const close = React.useCallback(() => setOpen(false), [])
  const toggle = React.useCallback(() => setOpen((v) => !v), [])
  return { open, openNav, close, toggle }
}

