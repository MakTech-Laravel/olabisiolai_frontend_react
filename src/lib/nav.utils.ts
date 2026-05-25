export function isActivePath(currentPath: string, target: string, end = false) {
  if (end) return currentPath === target
  if (currentPath === target) return true
  return currentPath.startsWith(target.endsWith('/') ? target : `${target}/`)
}

