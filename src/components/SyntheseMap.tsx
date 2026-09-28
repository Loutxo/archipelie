'use client'
import { useEffect, useRef, useState } from 'react'
import { PIN_CATEGORIES, MANQUES } from '@/lib/constants'
import type { Map as LMap } from 'leaflet'

interface Pin {
  lat: number
  lng: number
  label: string
  type: string
  manque_key?: string
}

export default function SyntheseMap({ pins }: { pins: Pin[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!mapRef.current || pins.length === 0) return
    let cancelled = false
    let map: LMap | null = null

    import('leaflet').then(L => {
      if (cancelled || !mapRef.current) return
      const leaflet = L.default

      // @ts-expect-error - internal
      delete leaflet.Icon.Default.prototype._getIconUrl
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      map = leaflet.map(mapRef.current, {
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: false,
      })

      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

      pins.forEach(pin => {
        const cat = PIN_CATEGORIES.find(c => c.type === pin.type) ?? PIN_CATEGORIES[PIN_CATEGORIES.length - 1]
        let pinIcon = cat.icon
        if (pin.type === 'collectif' && pin.manque_key) {
          const manque = MANQUES.find(m => m.key === pin.manque_key)
          if (manque) pinIcon = manque.icon
        }
        const icon = leaflet.divIcon({
          className: '',
          html: `<div style="background:${cat.color};border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:22px;height:22px;box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:11px">${pinIcon}</span></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 22],
        })
        leaflet.marker([pin.lat, pin.lng], { icon }).addTo(map!).bindTooltip(pin.label)
      })

      const bounds = leaflet.latLngBounds(pins.map(p => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [30, 30] })
      setReady(true)
    })

    return () => {
      cancelled = true
      map?.remove()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full rounded-xl border border-terre-100 overflow-hidden"
        style={{ height: '280px' }}
      />
      {!ready && (
        <div className="absolute inset-0 bg-terre-100 rounded-xl flex items-center justify-center">
          <p className="text-terre-400 text-sm">Chargement…</p>
        </div>
      )}
    </div>
  )
}
