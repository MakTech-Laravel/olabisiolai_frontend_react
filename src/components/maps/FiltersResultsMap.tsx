type Props = {
  center: { lat: number; lng: number }
  centerLabel?: string
  className?: string
}

function buildEmbedUrl(center: { lat: number; lng: number }, centerLabel?: string): string {
  if (centerLabel?.trim()) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(centerLabel.trim())}&t=&z=12&ie=UTF8&iwloc=&output=embed`
  }

  return `https://maps.google.com/maps?q=${center.lat},${center.lng}&ll=${center.lat},${center.lng}&z=12&ie=UTF8&iwloc=&output=embed`
}

/** Shows a single location on the map (first result or geo search point). */
export function FiltersResultsMap({ center, centerLabel, className }: Props) {
  const embedSrc = buildEmbedUrl(center, centerLabel)

  return (
    <iframe
      title="Business results map"
      src={embedSrc}
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
