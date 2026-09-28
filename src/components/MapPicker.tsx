'use client'
import { useEffect, useRef, useState } from 'react'
import type { Pin, PinCategory } from '@/types'
import { PIN_CATEGORIES, MANQUES } from '@/lib/constants'

let L: typeof import('leaflet') | null = null

function coloredMarker(color: string, icon: string): L.DivIcon {
  return L!.divIcon({
    className: '',
    html: `
      <div style="
        background:${color};
        border:2px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        width:28px;height:28px;
        box-shadow:0 2px 6px rgba(0,0,0,.3);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:13px">${icon}</span>
      </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })
}

function pinIcon(pin: Pin): { color: string; icon: string; label: string } {
  const cat = PIN_CATEGORIES.find(c => c.type === pin.type)!
  if (pin.type === 'collectif' && pin.manque_key) {
    const manque = MANQUES.find(m => m.key === pin.manque_key)
    if (manque) return { color: cat.color, icon: manque.icon, label: manque.label }
  }
  return { color: cat.color, icon: cat.icon, label: cat.label }
}

interface Props {
  pins: Pin[]
  onChange: (pins: Pin[]) => void
}

interface PendingPin {
  lat: number
  lng: number
  type: PinCategory
}

export default function MapPicker({ pins, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const [selectedType, setSelectedType] = useState<PinCategory>('maison')
  const [mapReady, setMapReady] = useState(false)
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null)
  const [pendingLabel, setPendingLabel] = useState('')
  const [pendingManqueKey, setPendingManqueKey] = useState('')
  const labelInputRef = useRef<HTMLInputElement>(null)

  const selectedTypeRef = useRef<PinCategory>(selectedType)
  useEffect(() => { selectedTypeRef.current = selectedType }, [selectedType])

  useEffect(() => {
    if (!mapRef.current) return
    let cancelled = false

    import('leaflet').then(leaflet => {
      if (cancelled || !mapRef.current) return
      L = leaflet.default

      // @ts-expect-error - internal Leaflet property
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current, {
        center: [50.85, 4.35],
        zoom: 13,
        zoomControl: true,
        doubleClickZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      map.on('click', (e: L.LeafletMouseEvent) => {
        setPendingPin({ lat: e.latlng.lat, lng: e.latlng.lng, type: selectedTypeRef.current })
        setPendingLabel('')
        setPendingManqueKey('')
      })

      mapInstance.current = map
      setMapReady(true)

      if (pins.length > 1) {
        const bounds = L.latLngBounds(pins.map(p => [p.lat, p.lng] as [number, number]))
        map.fitBounds(bounds, { padding: [50, 50] })
      } else if (pins.length === 1) {
        map.setView([pins[0].lat, pins[0].lng], 14)
      } else {
        navigator.geolocation?.getCurrentPosition(pos => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 14)
        })
      }
    })

    return () => {
      cancelled = true
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (pendingPin) setTimeout(() => labelInputRef.current?.focus(), 50)
  }, [pendingPin])

  const [pinsState, setPinsState] = useState<Pin[]>(pins)

  useEffect(() => {
    if (!mapInstance.current || !L) return
    const map = mapInstance.current
    const currentIds = new Set(pinsState.map(p => p.id))

    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    })

    pinsState.forEach(pin => {
      if (!markersRef.current.has(pin.id)) {
        const { color, icon, label } = pinIcon(pin)
        const marker = L!.marker([pin.lat, pin.lng], {
          icon: coloredMarker(color, icon),
        })
          .addTo(map)
          .bindPopup(`
            <strong>${pin.label}</strong><br/>
            <span style="color:#888;font-size:12px">${label}</span><br/>
            <button
              onclick="document.dispatchEvent(new CustomEvent('remove-pin',{detail:'${pin.id}'}))"
              style="margin-top:6px;color:#c0395a;font-size:12px;cursor:pointer;border:none;background:none;padding:0"
            >Supprimer ce lieu</button>
          `)
        markersRef.current.set(pin.id, marker)
      }
    })

    if (pinsState.length > 1) {
      const bounds = L.latLngBounds(pinsState.map(p => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [pinsState, mapReady])

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail
      setPinsState(prev => {
        const next = prev.filter(p => p.id !== id)
        onChange(next)
        return next
      })
    }
    document.addEventListener('remove-pin', handler)
    return () => document.removeEventListener('remove-pin', handler)
  }, [onChange])

  function cancelPending() {
    setPendingPin(null)
    setPendingLabel('')
    setPendingManqueKey('')
  }

  function confirmPin() {
    if (!pendingPin || !pendingLabel.trim()) return
    if (pendingPin.type === 'collectif' && !pendingManqueKey) return

    const newPin: Pin = {
      id: `pin-${Date.now()}`,
      type: pendingPin.type,
      label: pendingLabel.trim(),
      lat: pendingPin.lat,
      lng: pendingPin.lng,
      ...(pendingPin.type === 'collectif' ? { manque_key: pendingManqueKey } : {}),
    }
    setPinsState(prev => {
      const next = [...prev, newPin]
      onChange(next)
      return next
    })
    cancelPending()
  }

  const isCollectif = pendingPin?.type === 'collectif'
  const canConfirm = !!pendingLabel.trim() && (!isCollectif || !!pendingManqueKey)

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="flex flex-wrap gap-2">
        {PIN_CATEGORIES.map(cat => (
          <button
            key={cat.type}
            onClick={() => setSelectedType(cat.type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedType === cat.type
                ? 'border-transparent text-white'
                : 'border-terre-200 text-terre-600 hover:border-terre-300 bg-white'
            }`}
            style={selectedType === cat.type ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full rounded-xl border border-terre-200 overflow-hidden"
          style={{ height: '420px' }}
        />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-terre-100 rounded-xl">
            <p className="text-terre-400 text-sm">Chargement de la carte…</p>
          </div>
        )}
        {mapReady && !pendingPin && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-terre-600 text-xs px-3 py-1.5 rounded-full border border-terre-200 pointer-events-none">
            Clique sur la carte pour ajouter un lieu
          </div>
        )}

        {/* Inline form */}
        {pendingPin && (
          <div className="absolute bottom-3 left-3 right-3 bg-white rounded-xl border border-terre-200 shadow-lg p-3 z-[1000] space-y-2">
            <p className="text-terre-600 text-xs font-medium">
              {PIN_CATEGORIES.find(c => c.type === pendingPin.type)?.icon}{' '}
              {isCollectif ? 'Ajouter un collectif ou une initiative' : `Nom de ce lieu (${PIN_CATEGORIES.find(c => c.type === pendingPin.type)?.label})`}
            </p>

            {/* Manque category selector - collectif only */}
            {isCollectif && (
              <select
                value={pendingManqueKey}
                onChange={e => setPendingManqueKey(e.target.value)}
                className="w-full border border-terre-200 rounded-lg px-3 py-1.5 text-sm text-terre-800 focus:outline-none focus:ring-2 focus:ring-terre-300 bg-white"
              >
                <option value="">- Quel manque ce collectif adresse-t-il ? -</option>
                {MANQUES.map(m => (
                  <option key={m.key} value={m.key}>{m.icon} {m.label}</option>
                ))}
              </select>
            )}

            <div className="flex gap-2">
              <input
                ref={labelInputRef}
                type="text"
                value={pendingLabel}
                onChange={e => setPendingLabel(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') confirmPin()
                  if (e.key === 'Escape') cancelPending()
                }}
                placeholder={isCollectif ? 'Nom de l\'initiative…' : 'Ex : Chez moi, Café du coin…'}
                className="flex-1 border border-terre-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-terre-300"
              />
              <button
                onClick={confirmPin}
                disabled={!canConfirm}
                className="px-3 py-1.5 bg-terre-600 text-white rounded-lg text-sm disabled:opacity-40 hover:bg-terre-700 transition-colors"
              >
                Ajouter
              </button>
              <button
                onClick={cancelPending}
                className="px-3 py-1.5 text-terre-400 hover:text-terre-600 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pin list */}
      {pinsState.length > 0 && (
        <div className="space-y-1.5">
          {pinsState.map(pin => {
            const { icon, label } = pinIcon(pin)
            return (
              <div
                key={pin.id}
                className="flex items-center gap-2 bg-white border border-terre-100 rounded-lg px-3 py-2 text-sm"
              >
                <span>{icon}</span>
                <span className="text-terre-700 flex-1">{pin.label}</span>
                <span className="text-terre-400 text-xs">{label}</span>
                <button
                  onClick={() => {
                    setPinsState(prev => {
                      const next = prev.filter(p => p.id !== pin.id)
                      onChange(next)
                      return next
                    })
                  }}
                  className="text-terre-300 hover:text-red-400 transition-colors ml-1"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
