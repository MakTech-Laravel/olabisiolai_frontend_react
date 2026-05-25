import { importLibrary } from '@googlemaps/js-api-loader'
import { Loader2, MapPin } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { GeoMapPick } from '@/features/maps/geoMapTypes'
import { NIGERIA_MAP_BOUNDS, NIGERIA_MAP_CENTER } from '@/features/maps/geoMapTypes'
import { ensureGoogleMapsConfigured } from '@/lib/googleMapsInit'

type Props = {
  apiKey: string | undefined
  onPick: (pick: GeoMapPick) => void
  className?: string
}

function labelFromGeocoder(result: google.maps.GeocoderResult): string {
  return (
    result.formatted_address?.trim() ||
    result.address_components?.[0]?.long_name?.trim() ||
    'Selected location'
  )
}

export function NigeriaLocationPickerMap({ apiKey, onPick, className }: Props) {
  const mapHostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const pendingRef = useRef(false)

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const emitPick = useCallback(
    async (location: google.maps.LatLngLiteral) => {
      if (pendingRef.current) return
      pendingRef.current = true
      setPending(true)
      let label = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
      try {
        const response = await geocoderRef.current?.geocode({ location })
        const first = response?.results?.[0]
        if (first) label = labelFromGeocoder(first)
      } catch {
        // Keep coordinate fallback label.
      } finally {
        pendingRef.current = false
        setPending(false)
      }

      const map = mapRef.current
      if (markerRef.current) {
        markerRef.current.setPosition(location)
        markerRef.current.setVisible(true)
      }
      if (map) {
        map.panTo(location)
        const zoom = map.getZoom() ?? 6
        if (zoom < 11) map.setZoom(11)
      }

      onPick({ lat: location.lat, lng: location.lng, label })
    },
    [onPick],
  )

  useEffect(() => {
    const mapHost = mapHostRef.current
    if (!apiKey?.trim() || !mapHost) {
      setStatus('idle')
      return
    }

    let cancelled = false
    let mapClickListener: google.maps.MapsEventListener | null = null

    setStatus('loading')
    setErrorMessage(null)

    const run = async () => {
      try {
        ensureGoogleMapsConfigured(apiKey.trim())
        const { Map } = (await importLibrary('maps')) as google.maps.MapsLibrary
        await importLibrary('geocoding')

        if (cancelled) return

        mapHost.innerHTML = ''

        const map = new Map(mapHost, {
          center: NIGERIA_MAP_CENTER,
          zoom: 6,
          restriction: { latLngBounds: NIGERIA_MAP_BOUNDS, strictBounds: false },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          draggableCursor: 'crosshair',
        })
        mapRef.current = map
        geocoderRef.current = new google.maps.Geocoder()

        markerRef.current = new google.maps.Marker({
          map,
          clickable: false,
          visible: false,
          title: 'Search here',
          zIndex: 1000,
        })

        mapClickListener = map.addListener('click', (ev: google.maps.MapMouseEvent) => {
          if (!ev.latLng) return
          void emitPick({ lat: ev.latLng.lat(), lng: ev.latLng.lng() })
        })

        if (!cancelled) setStatus('ready')
      } catch (e) {
        if (cancelled) return
        setErrorMessage(e instanceof Error ? e.message : 'Failed to load Google Maps')
        setStatus('error')
      }
    }

    void run()

    return () => {
      cancelled = true
      mapClickListener?.remove()
      markerRef.current?.setMap(null)
      markerRef.current = null
      mapRef.current = null
      geocoderRef.current = null
      mapHost.innerHTML = ''
    }
  }, [apiKey, emitPick])

  if (!apiKey?.trim()) {
    return (
      <div
        className={
          className ??
          'flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600'
        }
      >
        <MapPin className="mb-2 size-8 text-gray-400" aria-hidden />
        <p>Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY to enable the map picker.</p>
      </div>
    )
  }

  return (
    <div className={className ?? 'relative'}>
      <div
        ref={mapHostRef}
        className="h-[min(52vh,420px)] w-full rounded-lg border border-gray-200 bg-gray-100"
        role="application"
        aria-label="Nigeria map — click to choose a search area"
      />
      {(status === 'loading' || pending) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-white/60">
          <Loader2 className="size-8 animate-spin text-blue-600" aria-hidden />
        </div>
      )}
      {status === 'error' && errorMessage ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : (
        <p className="mt-2 text-xs text-gray-500">Click anywhere on the map to search businesses near that point.</p>
      )}
    </div>
  )
}
