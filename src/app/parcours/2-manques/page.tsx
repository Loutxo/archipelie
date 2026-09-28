'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MANQUES } from '@/lib/constants'

export default function ManquesPage() {
  const [selected, setSelected] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.manques?.manque_keys?.length) setSelected(data.manques.manque_keys)
        if (data.manques?.notes) setNotes(data.manques.notes)
      })
  }, [])

  function toggle(key: string) {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  async function handleSave() {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'manques', data: { manque_keys: selected, notes } }),
    })
    setSaving(false)
    router.push('/parcours/3-competences')
  }

  return (
    <main className="min-h-screen bg-terre-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-terre-400 text-sm mb-4">
            <Link href="/parcours" className="hover:text-mousse-600">Parcours</Link>
            <span>›</span>
            <span>Étape 2 sur 4</span>
          </div>
          <h1 className="text-3xl font-serif text-terre-800 mb-3">Qu'est-ce qui te manque ?</h1>
          <p className="text-terre-600 leading-relaxed">
            Non pas au sens de l'envie qu'un achat comblerait - au sens du commun.
            Qu'est-ce qui existerait dans la maille où tu voudrais vivre, et qui n'existe pas ?
            Sélectionne ce qui résonne. Il n'y a pas de bonne réponse.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {MANQUES.map(manque => {
            const isSelected = selected.includes(manque.key)
            return (
              <button
                key={manque.key}
                onClick={() => toggle(manque.key)}
                className={`text-left rounded-xl border p-4 transition-all ${
                  isSelected
                    ? 'border-mousse-400 bg-mousse-50 shadow-sm'
                    : 'border-terre-200 bg-white hover:border-terre-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{manque.icon}</span>
                  <div>
                    <p className={`font-medium text-sm leading-tight ${isSelected ? 'text-mousse-800' : 'text-terre-800'}`}>
                      {manque.label}
                    </p>
                    <p className="text-xs text-terre-400 mt-1 leading-relaxed">{manque.description}</p>
                  </div>
                  {isSelected && (
                    <span className="ml-auto shrink-0 text-mousse-500 text-lg">✓</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {selected.length > 0 && (
          <div className="bg-mousse-50 border border-mousse-200 rounded-xl p-4 mb-6 text-sm text-mousse-800">
            <strong>{selected.length} manque{selected.length > 1 ? 's' : ''} identifié{selected.length > 1 ? 's' : ''}.</strong>{' '}
            Dans la synthèse, tu verras si d'autres personnes proches de toi partagent ces manques.
          </div>
        )}

        <div className="mb-8">
          <label className="block text-sm text-terre-600 mb-2">
            Un manque qui n'est pas dans la liste, ou une précision à apporter ?
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Libre à toi de compléter…"
            className="w-full border border-terre-200 rounded-xl px-4 py-3 text-terre-800 text-sm focus:outline-none focus:ring-2 focus:ring-mousse-400 bg-white resize-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-mousse-600 hover:bg-mousse-700 disabled:opacity-40 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            {saving ? 'Sauvegarde…' : 'Enregistrer et continuer →'}
          </button>
          <Link href="/parcours/1-maille" className="text-terre-400 hover:text-terre-600 text-sm">
            ← Retour
          </Link>
        </div>
      </div>
    </main>
  )
}
