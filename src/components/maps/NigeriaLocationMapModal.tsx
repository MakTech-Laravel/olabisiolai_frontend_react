import { MapPin, X } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { NigeriaLocationPickerMap } from '@/components/maps/NigeriaLocationPickerMap'
import { Button } from '@/components/ui/button'
import { env } from '@/config/env'
import { DEFAULT_GEO_SEARCH_RADIUS_KM, type GeoMapPick } from '@/features/maps/geoMapTypes'

type Props = {
  open: boolean
  onClose: () => void
}

export function NigeriaLocationMapModal({ open, onClose }: Props) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  const goToFilters = useCallback(
    (pick: GeoMapPick) => {
      onClose()
      const params = new URLSearchParams({
        lat: pick.lat.toFixed(6),
        lng: pick.lng.toFixed(6),
        place: pick.label,
        radius_km: String(DEFAULT_GEO_SEARCH_RADIUS_KM),
        map: '1',
      })
      navigate(`/filters?${params.toString()}`)
    },
    [navigate, onClose],
  )

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nigeria-map-modal-title"
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          aria-label="Close map"
        >
          <X className="size-5" aria-hidden />
        </button>

        <div className="border-b border-gray-100 px-5 pb-4 pt-5 pr-12">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <MapPin className="size-5" aria-hidden />
            </span>
            <div>
              <h2 id="nigeria-map-modal-title" className="text-lg font-semibold text-[#191B23]">
                Choose a location in Nigeria
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Tap anywhere on the map to find businesses near that spot.
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          <NigeriaLocationPickerMap apiKey={env.googleMapsApiKey} onPick={goToFilters} />
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
