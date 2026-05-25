import * as React from 'react'

export function useScrollReveal<T extends Element>(options?: IntersectionObserverInit) {
  const ref = React.useRef<T | null>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(([entry]) => {
      setIsVisible(Boolean(entry?.isIntersecting))
    }, options)

    obs.observe(el)
    return () => obs.disconnect()
  }, [options])

  return { ref, isVisible }
}

