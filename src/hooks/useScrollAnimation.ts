import * as React from 'react'

/**
 * Minimal scroll animation trigger using IntersectionObserver.
 * Returns a ref and a boolean you can map to Tailwind classes.
 */
export function useScrollAnimation<T extends Element>(options?: IntersectionObserverInit) {
  const { ref, isVisible } = useScrollAnimationInternal<T>(options)
  return { ref, isVisible }
}

function useScrollAnimationInternal<T extends Element>(options?: IntersectionObserverInit) {
  const ref = React.useRef<T | null>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setIsVisible(true)
    }, options)
    obs.observe(el)
    return () => obs.disconnect()
  }, [options])

  return { ref, isVisible }
}

