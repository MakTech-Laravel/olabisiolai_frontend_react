import { importLibrary } from '@googlemaps/js-api-loader'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { ensureGoogleMapsConfigured } from '@/lib/googleMapsInit'
import { cn } from '@/lib/utils'

type Props = {
  apiKey: string | undefined
  businessName: string
  locationLabel: string
  latitude?: number | null
  longitude?: number | null
  className?: string
}

function embedMapUrl(query: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=14&ie=UTF8&iwloc=&output=embed`
}

function externalMapsUrl(lat: number | null, lng: number | null, label: string): string {
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`
}

export function BusinessServiceAreaMap({
  apiKey,
  businessName,
  locationLabel,
  latitude,
  longitude,
  className,
}: Props) {
  const mapHostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  const center = useMemo(() => {
    if (
      latitude != null &&
      longitude != null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      return { lat: latitude, lng: longitude }
    }
    return null
  }, [latitude, longitude])

  const mapsHref = useMemo(
    () => externalMapsUrl(center?.lat ?? null, center?.lng ?? null, locationLabel || businessName),
    [businessName, center, locationLabel],
  )

  useEffect(() => {
    const mapHost = mapHostRef.current
    if (!center || !apiKey?.trim() || !mapHost) {
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
            zoom: 14,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          })
          markerRef.current = new google.maps.Marker({
            map: mapRef.current,
            position: center,
            title: businessName || locationLabel,
            zIndex: 10,
          })
        } else {
          mapRef.current.setCenter(center)
          mapRef.current.setZoom(14)
          markerRef.current?.setPosition(center)
          markerRef.current?.setTitle(businessName || locationLabel)
        }

        if (!cancelled) setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [apiKey, businessName, center, locationLabel])

  useEffect(() => {
    return () => {
      markerRef.current?.setMap(null)
      markerRef.current = null
      mapRef.current = null
      if (mapHostRef.current) mapHostRef.current.innerHTML = ''
    }
  }, [])

  const queryLabel = locationLabel.trim() || businessName.trim() || 'Nigeria'

  return (
    <div
      className={cn(
        'relative h-80 overflow-hidden rounded-2xl border border-stat-muted shadow-inner md:h-96',
        className,
      )}
    >
      {center && apiKey?.trim() ? (
        <>
          <div
            ref={mapHostRef}
            className="absolute inset-0 size-full"
            role="application"
            aria-label="Business location map"
          />
          {status === 'loading' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/50">
              <Loader2 className="size-8 animate-spin text-brand" aria-hidden />
            </div>
          )}
          {status === 'error' && (
            <iframe
              title={`Map of ${businessName}`}
              src={embedMapUrl(`${center.lat},${center.lng}`)}
              className="absolute inset-0 size-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
        </>
      ) : (
        <iframe
          title={`Map of ${queryLabel}`}
          src={embedMapUrl(queryLabel)}
          className="absolute inset-0 size-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}

      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 left-4 z-10 rounded-lg bg-white/90 px-4 py-2 text-xs font-semibold text-ink shadow-md backdrop-blur-sm transition-colors hover:bg-white"
      >
        Click to expand detailed map
      </a>
    </div>
  )
}
