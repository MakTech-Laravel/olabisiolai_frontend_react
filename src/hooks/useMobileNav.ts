import * as React from 'react'

export function useMobileNav(initialOpen = false) {
  const [open, setOpen] = React.useState(initialOpen)
  const openNav = React.useCallback(() => setOpen(true), [])
  const closeNav = React.useCallback(() => setOpen(false), [])
  const toggleNav = React.useCallback(() => setOpen((v) => !v), [])
  return { open, openNav, closeNav, toggleNav }
}

