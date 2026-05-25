import { useLocation } from 'react-router-dom'

export function useActiveUrl() {
  const { pathname, search, hash } = useLocation()
  return { pathname, search, hash, fullPath: `${pathname}${search}${hash}` }
}

