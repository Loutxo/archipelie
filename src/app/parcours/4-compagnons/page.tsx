'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Compagnon {
  name: string
  notes: string
}

export default function CompagnonsPage() {
  const [compagnons, setCompagnons] = useState<Compagnon[]>([])
  const [nameInput, setNameInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [shareName, setShareName] = useState(true)
  const [shareManques, setShareManques] = useState(true)
  const [shareType, setShareType] = useState(true)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.compagnons?.length) setCompagnons(data.compagnons)
        if (data.visibility) {
          setIsVisible(data.visibility.is_visible ?? false)
          setShareName(data.visibility.share_name ?? true)
          setShareManques(data.visibility.share_manques ?? true)
          setShareType(data.visibility.share_type ?? true)
          setNotifyEmail(data.visibility.notify_email ?? true)
        }
      })
  }, [])

  function addCompagnon() {
    const name = nameInput.trim()
    if (!name) return
    setCompagnons(prev => [...prev, { name, notes: notesInput.trim() }])
    setNameInput('')
    setNotesInput('')
  }

  async function handleSave() {
    setSaving(true)
    await Promise.all([
      fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'compagnons', data: { compagnons } }),
      }),
      fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'visibility',
          data: { is_visible: isVisible, share_name: shareName, share_manques: shareManques, share_type: shareType, notify_email: notifyEmail },
        }),
      }),
    ])
    setSaving(false)
    router.push('/synthese')
  }

  return (
    <main className="min-h-screen bg-terre-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-terre-400 text-sm mb-4">
            <Link href="/parcours" className="hover:text-mousse-600">Parcours</Link>
            <span>›</span>
            <span>Étape 4 sur 4</span>
          </div>
          <h1 className="text-3xl font-serif text-terre-800 mb-3">Avec qui ?</h1>
          <p className="text-terre-600 leading-relaxed">
            Non pas avec quelles idées - avec quels visages. Peux-tu nommer trois personnes réelles
            qui pourraient partager un commencement avec toi ? Si oui, ton projet a une chance.
          </p>
        </div>

        {/* Three persons prompt */}
        <div className="bg-terre-800 text-terre-100 rounded-xl p-5 mb-8">
          <p className="font-serif text-lg mb-2">
            Accorde-toi cinq minutes, et projette-toi.
          </p>
          <p className="text-terre-300 text-sm leading-relaxed">
            Qui est dans la pièce avec toi ? Si tu peux nommer trois personnes réelles,
            ton commencement a une chance. Si tu n'en peux nommer aucune, le premier fil
            à tirer n'est pas le projet - c'est de trouver ces trois personnes.
          </p>
        </div>

        {/* Add compagnon */}
        <div className="bg-white rounded-2xl border border-terre-200 p-5 mb-6">
          <h2 className="font-serif text-terre-700 text-lg mb-4">Nomme tes compagnons potentiels</h2>
          <div className="space-y-3 mb-4">
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCompagnon()}
              placeholder="Prénom ou surnom"
              className="w-full border border-terre-200 rounded-lg px-4 py-3 text-terre-800 text-sm focus:outline-none focus:ring-2 focus:ring-mousse-400"
            />
            <input
              type="text"
              value={notesInput}
              onChange={e => setNotesInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCompagnon()}
              placeholder="Ce que cette personne apporte (optionnel)"
              className="w-full border border-terre-200 rounded-lg px-4 py-3 text-terre-800 text-sm focus:outline-none focus:ring-2 focus:ring-mousse-400"
            />
            <button
              onClick={addCompagnon}
              disabled={!nameInput.trim()}
              className="bg-terre-700 hover:bg-terre-800 disabled:opacity-40 text-white px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              Ajouter ce compagnon
            </button>
          </div>

          {compagnons.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-terre-100">
              {compagnons.map((c, i) => (
                <div key={i} className="flex items-center gap-3 bg-terre-50 rounded-lg px-4 py-2.5">
                  <span className="text-terre-400 text-lg">👤</span>
                  <div className="flex-1">
                    <p className="text-terre-800 font-medium text-sm">{c.name}</p>
                    {c.notes && <p className="text-terre-400 text-xs">{c.notes}</p>}
                  </div>
                  <button
                    onClick={() => setCompagnons(prev => prev.filter((_, j) => j !== i))}
                    className="text-terre-300 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className={`mt-2 text-sm font-medium ${compagnons.length >= 3 ? 'text-mousse-600' : 'text-terre-400'}`}>
                {compagnons.length >= 3
                  ? `✓ Tu as ${compagnons.length} compagnons. Ton commencement a une chance.`
                  : `${compagnons.length}/3 - Essaie d'en trouver au moins trois.`}
              </div>
            </div>
          )}
        </div>

        {/* Matching visibility */}
        <div className="bg-white rounded-2xl border border-terre-200 p-5 mb-8">
          <h2 className="font-serif text-terre-700 text-lg mb-2">Apparaître dans les matchs ?</h2>
          <p className="text-sm text-terre-500 mb-4 leading-relaxed">
            Si tu acceptes, d'autres personnes dans ta géographie pourront te voir dans leur synthèse
            - si vos manques et envies se recoupent. Tu choisis ce que tu partages.
          </p>

          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <div
              onClick={() => setIsVisible(v => !v)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isVisible ? 'bg-mousse-500' : 'bg-terre-200'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow ${isVisible ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-terre-700 text-sm font-medium">
              {isVisible ? 'Oui, je veux apparaître dans les matchs' : 'Non, je reste invisible'}
            </span>
          </label>

          {isVisible && (
            <div className="space-y-2 pl-4 border-l-2 border-mousse-200">
              {[
                { key: 'name', label: 'Partager mon prénom / pseudonyme', value: shareName, set: setShareName },
                { key: 'manques', label: 'Partager mes manques', value: shareManques, set: setShareManques },
                { key: 'type', label: 'Partager mon type de tisseur', value: shareType, set: setShareType },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opt.value}
                    onChange={() => opt.set(v => !v)}
                    className="rounded text-mousse-500"
                  />
                  <span className="text-sm text-terre-600">{opt.label}</span>
                </label>
              ))}
              <p className="text-xs text-terre-400 mt-1">
                Ta géographie approximative est toujours utilisée pour le matching, même sans ces informations.
              </p>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer mt-4 pt-4 border-t border-terre-100">
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={() => setNotifyEmail(v => !v)}
              className="rounded text-mousse-500"
            />
            <span className="text-sm text-terre-600">
              Me prévenir par email quand quelque chose de nouveau apparaît dans ma maille
              <span className="text-terre-400"> (au plus une fois par semaine)</span>
            </span>
          </label>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-mousse-600 hover:bg-mousse-700 disabled:opacity-40 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            {saving ? 'Sauvegarde…' : 'Voir ma synthèse →'}
          </button>
          <Link href="/parcours/3-competences" className="text-terre-400 hover:text-terre-600 text-sm">
            ← Retour
          </Link>
        </div>
      </div>
    </main>
  )
}
