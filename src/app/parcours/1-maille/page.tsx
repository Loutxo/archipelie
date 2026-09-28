'use client'
import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Pin } from '@/types'

// Leaflet must be dynamically imported (no SSR)
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-terre-100 rounded-xl flex items-center justify-center">
      <p className="text-terre-400 text-sm">Chargement de la carte…</p>
    </div>
  ),
})

const MAILLE_LABELS: Record<string, { label: string; color: string; description: string }> = {
  dispersee: {
    label: 'Maille dispersée',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    description: 'Tes lieux sont éparpillés sur plus de 10 km. Ta première tâche sera de reconcentrer ta géographie.',
  },
  resserree: {
    label: 'Maille resserrée',
    color: 'text-eau-700 bg-eau-50 border-eau-200',
    description: 'Tes lieux sont proches (3–10 km). Les ancrages sont là, les liens humains restent à tisser.',
  },
  dense: {
    label: 'Maille dense',
    color: 'text-mousse-700 bg-mousse-50 border-mousse-200',
    description: 'Tes lieux tiennent dans moins de 3 km. La géographie est favorable - il reste à approfondir.',
  },
}

function computeMailleType(pins: Pin[]): { type: string; radius_km: number } | null {
  if (pins.length < 2) return null
  const R = 6371
  const centerLat = pins.reduce((s, p) => s + p.lat, 0) / pins.length
  const centerLng = pins.reduce((s, p) => s + p.lng, 0) / pins.length
  const maxDist = Math.max(...pins.map(p => {
    const dLat = (p.lat - centerLat) * Math.PI / 180
    const dLng = (p.lng - centerLng) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(centerLat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }))
  const radius_km = Math.round(maxDist * 10) / 10
  const type = radius_km < 3 ? 'dense' : radius_km < 10 ? 'resserree' : 'dispersee'
  return { type, radius_km }
}

export default function MaillePage() {
  const [pins, setPins] = useState<Pin[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.maille?.pins?.length) setPins(data.maille.pins)
      })
      .finally(() => setLoading(false))
  }, [])

  const maille = pins.length >= 2 ? computeMailleType(pins) : null

  const handlePinsChange = useCallback((newPins: Pin[]) => {
    setPins(newPins)
    setSaved(false)
  }, [])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'maille', data: { pins } }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => router.push('/parcours/2-manques'), 800)
    }
  }

  return (
    <main className="min-h-screen bg-terre-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-terre-400 text-sm mb-4">
            <Link href="/parcours" className="hover:text-mousse-600">Parcours</Link>
            <span>›</span>
            <span>Étape 1 sur 4</span>
          </div>
          <h1 className="text-3xl font-serif text-terre-800 mb-3">Où es-tu vraiment ?</h1>
          <p className="text-terre-600 leading-relaxed">
            Place tes lieux quotidiens sur la carte : ton domicile, ton travail, l'école, tes commerces habituels,
            tes lieux réguliers. Le dessin de ta maille apparaîtra au fur et à mesure.
          </p>
        </div>

        {/* Maille indicator */}
        {maille && (
          <div className={`rounded-xl border px-5 py-4 mb-6 ${MAILLE_LABELS[maille.type].color}`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="font-semibold">{MAILLE_LABELS[maille.type].label}</span>
                <p className="text-sm mt-1 opacity-80">{MAILLE_LABELS[maille.type].description}</p>
              </div>
              <span className="text-sm font-mono shrink-0 ml-4 opacity-70">~{maille.radius_km} km</span>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="bg-white rounded-2xl border border-terre-200 p-4 mb-6">
          {loading ? (
            <div className="w-full h-96 flex items-center justify-center text-terre-400 text-sm">
              Chargement…
            </div>
          ) : (
            <MapPicker pins={pins} onChange={handlePinsChange} />
          )}
        </div>

        {/* Tip */}
        <div className="bg-terre-100 rounded-xl p-4 text-sm text-terre-600 leading-relaxed mb-8">
          <strong className="text-terre-700">Conseil :</strong> Ajoute au moins 4–5 lieux pour que la forme
          de ta maille soit significative. N'oublie pas les lieux où tu vas régulièrement mais qui semblent
          anodins - une boulangerie, un parc, un ami.
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={pins.length === 0 || saving}
            className="bg-mousse-600 hover:bg-mousse-700 disabled:opacity-40 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            {saving ? 'Sauvegarde…' : saved ? '✓ Sauvegardé' : 'Enregistrer et continuer →'}
          </button>
          <Link
            href="/parcours/2-manques"
            className="text-terre-400 hover:text-terre-600 text-sm transition-colors"
          >
            Passer cette étape
          </Link>
        </div>
      </div>
    </main>
  )
}
