import { importLibrary } from '@googlemaps/js-api-loader'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { ensureGoogleMapsConfigured } from '@/lib/googleMapsInit'

export type MapBusinessPin = {
  id: number
  name: string
  lat: number
  lng: number
}

type Props = {
  apiKey: string | undefined
  center: { lat: number; lng: number }
  centerLabel?: string
  businesses?: MapBusinessPin[]
  className?: string
}

function embedMapUrl(center: { lat: number; lng: number }, label?: string): string {
  const q = label?.trim() ? encodeURIComponent(label) : `${center.lat},${center.lng}`
  return `https://maps.google.com/maps?q=${q}&ll=${center.lat},${center.lng}&z=13&ie=UTF8&iwloc=&output=embed`
}

export function FiltersResultsMap({
  apiKey,
  center,
  centerLabel,
  businesses = [],
  className,
}: Props) {
  const mapHostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const centerMarkerRef = useRef<google.maps.Marker | null>(null)
  const businessMarkersRef = useRef<google.maps.Marker[]>([])

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  useEffect(() => {
    const mapHost = mapHostRef.current
    if (!apiKey?.trim() || !mapHost) {
      setStatus('idle')
      return
    }

    let cancelled = false

    setStatus('loading')

    const run = async () => {
      try {
        ensureGoogleMapsConfigured(apiKey.trim())
        const { Map } = (await importLibrary('maps')) as google.maps.MapsLibrary

        if (cancelled) return

        if (!mapRef.current) {
          mapHost.innerHTML = ''
          mapRef.current = new Map(mapHost, {
            center,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          })
          centerMarkerRef.current = new google.maps.Marker({
            map: mapRef.current,
            position: center,
            title: centerLabel ?? 'Your search area',
            zIndex: 1000,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          })
        } else {
          mapRef.current.setCenter(center)
          centerMarkerRef.current?.setPosition(center)
        }

        businessMarkersRef.current.forEach((m) => m.setMap(null))
        businessMarkersRef.current = businesses.map((b) => {
          return new google.maps.Marker({
            map: mapRef.current!,
            position: { lat: b.lat, lng: b.lng },
            title: b.name,
            zIndex: 10,
          })
        })

        if (!cancelled) setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [apiKey, center.lat, center.lng, centerLabel, businesses.map((b) => b.id).join(',')])

  useEffect(() => {
    return () => {
      businessMarkersRef.current.forEach((m) => m.setMap(null))
      businessMarkersRef.current = []
      centerMarkerRef.current?.setMap(null)
      centerMarkerRef.current = null
      mapRef.current = null
      if (mapHostRef.current) mapHostRef.current.innerHTML = ''
    }
  }, [])

  if (!apiKey?.trim()) {
    return (
      <iframe
        title="Map"
        src={embedMapUrl(center, centerLabel)}
        width="100%"
        height="100%"
        className={className}
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    )
  }

  return (
    <div className={className ?? 'relative h-full w-full'}>
      <div ref={mapHostRef} className="h-full w-full" role="application" aria-label="Business map" />
      {status === 'loading' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/50">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        </div>
      )}
      {status === 'error' && (
        <iframe
          title="Map fallback"
          src={embedMapUrl(center, centerLabel)}
          width="100%"
          height="100%"
          className="absolute inset-0"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}
    </div>
  )
}
