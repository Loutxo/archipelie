'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MANQUES, COMPETENCES, MAILLE_ADVICE, COMPETENCE_ADVICE } from '@/lib/constants'
import type { MatchResult, MailleType, CompetenceType, CollectifResult, EchangeItem, NearbyEchangeItem } from '@/types'

const SyntheseMap = dynamic(() => import('@/components/SyntheseMap'), { ssr: false })

interface Profile {
  maille: {
    pins: { lat: number; lng: number; label: string; type: string; manque_key?: string }[]
    maille_type: MailleType
    radius_km: number
    center_lat: number | null
    center_lng: number | null
  } | null
  manques: { manque_keys: string[]; notes: string } | null
  competences: {
    primary_type: CompetenceType
    secondary_type: CompetenceType | null
    skills_free: string[]
    learning_intent: string
  } | null
  compagnons: { name: string; notes: string }[]
  visibility: { is_visible: boolean } | null
}

export default function SynthesePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [collectifs, setCollectifs] = useState<CollectifResult[]>([])
  const [myEchanges, setMyEchanges] = useState<EchangeItem[]>([])
  const [nearbyEchanges, setNearbyEchanges] = useState<NearbyEchangeItem[]>([])
  const [loading, setLoading] = useState(true)

  const [showAddCollectif, setShowAddCollectif] = useState(false)
  const [newCollectif, setNewCollectif] = useState({
    nom: '', description: '', contact: '', manque_keys: [] as string[],
  })
  const [addCollectifSaving, setAddCollectifSaving] = useState(false)

  const [showAddEchange, setShowAddEchange] = useState<'offre' | 'demande' | null>(null)
  const [newEchangeDesc, setNewEchangeDesc] = useState('')
  const [newEchangeManque, setNewEchangeManque] = useState('')
  const [addEchangeSaving, setAddEchangeSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then(r => r.json()),
      fetch('/api/matches?radius=30').then(r => r.json()),
      fetch('/api/collectifs?radius=30').then(r => r.json()).catch(() => ({ collectifs: [] })),
      fetch('/api/echanges').then(r => r.json()).catch(() => ({ echanges: [] })),
      fetch('/api/echanges?nearby=1&radius=15').then(r => r.json()).catch(() => ({ echanges: [] })),
    ]).then(([profileData, matchData, collectifData, echangeData, nearbyData]) => {
      setProfile(profileData)
      setMatches(matchData.matches ?? [])
      setCollectifs(collectifData.collectifs ?? [])
      setMyEchanges(echangeData.echanges ?? [])
      setNearbyEchanges(nearbyData.echanges ?? [])
      setLoading(false)
    })
  }, [])

  async function createCollectif() {
    if (!newCollectif.nom.trim()) return
    const lat = profile?.maille?.center_lat
    const lng = profile?.maille?.center_lng
    if (!lat || !lng) return
    setAddCollectifSaving(true)
    const res = await fetch('/api/collectifs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...newCollectif, lat, lng }),
    })
    if (res.ok) {
      const data = await fetch('/api/collectifs?radius=30').then(r => r.json())
      setCollectifs(data.collectifs ?? [])
      setNewCollectif({ nom: '', description: '', contact: '', manque_keys: [] })
      setShowAddCollectif(false)
    }
    setAddCollectifSaving(false)
  }

  async function createEchange() {
    if (!newEchangeDesc.trim() || !showAddEchange) return
    setAddEchangeSaving(true)
    const res = await fetch('/api/echanges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        direction: showAddEchange,
        description: newEchangeDesc,
        manque_key: newEchangeManque || null,
      }),
    })
    if (res.ok) {
      const data = await fetch('/api/echanges').then(r => r.json())
      setMyEchanges(data.echanges ?? [])
      setNewEchangeDesc('')
      setNewEchangeManque('')
      setShowAddEchange(null)
    }
    setAddEchangeSaving(false)
  }

  async function deleteEchange(id: string) {
    await fetch('/api/echanges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    setMyEchanges(prev => prev.filter(e => e.id !== id))
  }

  function toggleManqueForCollectif(key: string) {
    setNewCollectif(prev => ({
      ...prev,
      manque_keys: prev.manque_keys.includes(key)
        ? prev.manque_keys.filter(k => k !== key)
        : [...prev.manque_keys, key],
    }))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-terre-50 flex items-center justify-center">
        <p className="text-terre-400">Chargement de ta synthèse…</p>
      </main>
    )
  }

  const mailleType = profile?.maille?.maille_type
  const maiileAdvice = mailleType ? MAILLE_ADVICE[mailleType] : null
  const primaryType = profile?.competences?.primary_type
  const compAdvice = primaryType ? COMPETENCE_ADVICE[primaryType] : null
  const primaryComp = primaryType ? COMPETENCES.find(c => c.type === primaryType) : null
  const manqueKeys = profile?.manques?.manque_keys ?? []
  const selectedManques = MANQUES.filter(m => manqueKeys.includes(m.key))

  const myOffres = myEchanges.filter(e => e.direction === 'offre')
  const myDemandes = myEchanges.filter(e => e.direction === 'demande')
  const nearbyDemandes = nearbyEchanges.filter(e => e.direction === 'demande')
  const nearbyOffres = nearbyEchanges.filter(e => e.direction === 'offre')

  function downloadSummary() {
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

    const manquesHtml = selectedManques.length > 0
      ? selectedManques.map(m => `<span class="tag">${m.icon} ${m.label}</span>`).join('')
      : '<em class="empty">Non renseigné</em>'

    const skillsHtml = (profile?.competences?.skills_free ?? []).length > 0
      ? (profile!.competences!.skills_free).map(s => `<span class="tag">${s}</span>`).join('')
      : ''

    const compagnonsHtml = (profile?.compagnons ?? []).length > 0
      ? profile!.compagnons.map(c => `
          <div class="companion">
            <strong>${c.name}</strong>
            ${c.notes ? `<span class="note">${c.notes}</span>` : ''}
          </div>`).join('')
      : '<em class="empty">Aucun compagnon renseigné</em>'

    const actionsHtml = maiileAdvice?.actions.length
      ? maiileAdvice.actions.map(a => `<li>${a}</li>`).join('')
      : ''

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Ma synthèse Archipélie - ${date}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; color: #2d2416; background: #fff; padding: 40px; max-width: 720px; margin: auto; }
    h1 { font-size: 28px; color: #2d2416; margin-bottom: 4px; }
    .subtitle { color: #8a7060; font-size: 14px; margin-bottom: 36px; font-family: sans-serif; }
    .section { border: 1px solid #e8ddd4; border-radius: 12px; padding: 24px; margin-bottom: 20px; break-inside: avoid; }
    .section-num { color: #c8b8a8; font-family: sans-serif; font-size: 13px; margin-bottom: 6px; }
    h2 { font-size: 20px; color: #2d2416; margin-bottom: 14px; }
    .tag { display: inline-block; background: #f5efe9; border: 1px solid #e8ddd4; color: #5a4030; font-family: sans-serif; font-size: 13px; padding: 4px 12px; border-radius: 20px; margin: 3px 3px 3px 0; }
    .advice-title { font-family: sans-serif; font-weight: 600; color: #3a5a3a; margin-bottom: 6px; }
    .advice-text { font-family: sans-serif; font-size: 13px; color: #5a7a5a; line-height: 1.6; margin-bottom: 10px; }
    ul.actions { list-style: none; padding: 0; }
    ul.actions li { font-family: sans-serif; font-size: 13px; color: #3a5a3a; padding: 4px 0; padding-left: 18px; position: relative; }
    ul.actions li::before { content: "→"; position: absolute; left: 0; color: #6a9a6a; }
    .companion { background: #f9f5f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; font-family: sans-serif; font-size: 14px; }
    .companion .note { color: #8a7060; font-size: 12px; margin-left: 8px; }
    .empty { color: #b0a090; font-style: italic; font-family: sans-serif; font-size: 13px; }
    .note-italic { font-style: italic; color: #8a7060; font-family: sans-serif; font-size: 13px; margin-top: 10px; }
    .footer { margin-top: 32px; text-align: center; font-family: sans-serif; font-size: 12px; color: #c0b0a0; border-top: 1px solid #e8ddd4; padding-top: 16px; }
    @media print {
      body { padding: 20px; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>Ma synthèse</h1>
  <p class="subtitle">Archipélie - ${date}</p>

  <div class="section">
    <div class="section-num">01</div>
    <h2>Ta maille</h2>
    ${maiileAdvice ? `
      <p style="font-family:sans-serif;font-size:14px;margin-bottom:12px">
        <strong>${maiileAdvice.title}</strong>
        ${profile?.maille?.radius_km ? ` - environ ${profile.maille.radius_km} km de rayon` : ''}
      </p>
      <p class="advice-text">${maiileAdvice.text}</p>
      ${actionsHtml ? `<ul class="actions">${actionsHtml}</ul>` : ''}
    ` : '<em class="empty">Maille non renseignée</em>'}
  </div>

  <div class="section">
    <div class="section-num">02</div>
    <h2>Tes manques</h2>
    <div>${manquesHtml}</div>
    ${profile?.manques?.notes ? `<p class="note-italic">${profile.manques.notes}</p>` : ''}
  </div>

  <div class="section">
    <div class="section-num">03</div>
    <h2>Ton art</h2>
    ${primaryComp ? `
      <p style="font-family:sans-serif;font-weight:600;font-size:16px;margin-bottom:6px">${primaryComp.icon} ${primaryComp.label}</p>
      <p style="font-family:sans-serif;font-size:13px;color:#7a6a5a;margin-bottom:10px">${primaryComp.description}</p>
      ${skillsHtml ? `<div>${skillsHtml}</div>` : ''}
      ${compAdvice ? `
        <div style="margin-top:14px;border-top:1px solid #e8ddd4;padding-top:12px">
          <p class="advice-title">${compAdvice.title}</p>
          <p class="advice-text">${compAdvice.text}</p>
        </div>` : ''}
    ` : '<em class="empty">Compétences non renseignées</em>'}
  </div>

  <div class="section">
    <div class="section-num">04</div>
    <h2>Tes compagnons</h2>
    ${compagnonsHtml}
  </div>

  <div class="footer">archipelie.fr - La méthode de l'Épilogue</div>

  <script>window.onload = function() { window.print() }</script>
</body>
</html>`

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  return (
    <main className="min-h-screen bg-terre-50">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-10">
          <p className="text-mousse-600 text-sm font-medium tracking-wide uppercase mb-2">Synthèse</p>
          <h1 className="text-3xl font-serif text-terre-800 mb-3">Tes quatre cartes</h1>
          <p className="text-terre-500 leading-relaxed">
            Là où elles se recoupent se dessine le fil que tu peux tirer.
            Cette zone n'appartient qu'à toi.
          </p>
        </div>

        {/* Card 1: Maille */}
        <section className="bg-white rounded-2xl border border-terre-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-terre-800 text-xl">
              <span className="text-terre-300 mr-2">01</span> Ta maille
            </h2>
            {mailleType && (
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                mailleType === 'dense' ? 'bg-mousse-100 text-mousse-700' :
                mailleType === 'resserree' ? 'bg-eau-100 text-eau-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {mailleType === 'dense' ? 'Dense' : mailleType === 'resserree' ? 'Resserrée' : 'Dispersée'}
                {profile?.maille?.radius_km ? ` - ~${profile.maille.radius_km} km` : ''}
              </span>
            )}
          </div>

          {profile?.maille?.pins && profile.maille.pins.length > 0 ? (
            <SyntheseMap pins={profile.maille.pins} />
          ) : (
            <div className="bg-terre-50 rounded-xl h-40 flex items-center justify-center">
              <Link href="/parcours/1-maille" className="text-mousse-600 hover:underline text-sm">
                → Cartographier ta maille
              </Link>
            </div>
          )}

          {maiileAdvice && (
            <div className="mt-4 pt-4 border-t border-terre-100">
              <p className="font-medium text-terre-700 mb-2">{maiileAdvice.title}</p>
              <p className="text-sm text-terre-500 leading-relaxed mb-3">{maiileAdvice.text}</p>
              <ul className="space-y-1.5">
                {maiileAdvice.actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-terre-600">
                    <span className="text-mousse-500 shrink-0 mt-0.5">→</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Card 2: Manques */}
        <section className="bg-white rounded-2xl border border-terre-200 p-6 mb-6">
          <h2 className="font-serif text-terre-800 text-xl mb-4">
            <span className="text-terre-300 mr-2">02</span> Tes manques
          </h2>
          {selectedManques.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedManques.map(m => (
                <span key={m.key} className="flex items-center gap-1.5 bg-terre-50 border border-terre-200 text-terre-700 text-sm px-3 py-1.5 rounded-full">
                  {m.icon} {m.label}
                </span>
              ))}
            </div>
          ) : (
            <Link href="/parcours/2-manques" className="text-mousse-600 hover:underline text-sm">
              → Identifier tes manques
            </Link>
          )}
          {profile?.manques?.notes && (
            <p className="text-sm text-terre-500 italic mt-3">{profile.manques.notes}</p>
          )}
        </section>

        {/* Collectifs dans ta maille */}
        <section className="bg-white rounded-2xl border border-terre-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-1">
            <h2 className="font-serif text-terre-800 text-xl">
              <span className="text-terre-300 mr-2">→</span> Initiatives dans ta maille
            </h2>
          </div>
          <p className="text-sm text-terre-400 mb-4">
            Collectifs et initiatives proches qui répondent à au moins un de tes manques.
          </p>

          {selectedManques.length === 0 ? (
            <p className="text-sm text-terre-400 italic">
              Renseigne tes manques à l'étape 2 pour découvrir les collectifs proches.
            </p>
          ) : collectifs.length > 0 ? (
            <div className="space-y-3">
              {collectifs.map(c => (
                <div key={c.collectif_id} className="bg-terre-50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-terre-800">{c.nom}</p>
                      {c.description && (
                        <p className="text-sm text-terre-500 mt-1">{c.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.manque_keys.map(key => {
                          const m = MANQUES.find(m => m.key === key)
                          return m ? (
                            <span key={key} className="text-xs bg-white border border-terre-200 text-terre-600 px-2 py-0.5 rounded-full">
                              {m.icon} {m.label}
                            </span>
                          ) : null
                        })}
                      </div>
                      {c.contact && (
                        <p className="text-xs text-mousse-600 mt-2">Contact : {c.contact}</p>
                      )}
                    </div>
                    <span className="text-xs text-terre-400 shrink-0">{c.distance_label}</span>
                  </div>
                  <p className="text-xs text-terre-400 mt-2">
                    {c.membre_count} membre{c.membre_count > 1 ? 's' : ''} déclaré{c.membre_count > 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-terre-50 rounded-xl p-5 text-center">
              <p className="text-terre-500 text-sm">Aucune initiative connue dans ta maille pour l'instant.</p>
            </div>
          )}

          {/* Add collectif form */}
          {showAddCollectif ? (
            <div className="mt-4 bg-mousse-50 border border-mousse-200 rounded-xl p-4 space-y-3">
              <p className="font-medium text-terre-800 text-sm">Renseigner un collectif</p>
              <p className="text-xs text-terre-500">
                GASAP, repair café, coopérative d'énergie… Sa position sera localisée dans ta maille (floue à ~1 km).
              </p>
              <input
                type="text"
                value={newCollectif.nom}
                onChange={e => setNewCollectif(p => ({ ...p, nom: e.target.value }))}
                placeholder="Nom de l'initiative *"
                className="w-full border border-terre-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mousse-400"
              />
              <textarea
                value={newCollectif.description}
                onChange={e => setNewCollectif(p => ({ ...p, description: e.target.value }))}
                placeholder="Description (optionnel)"
                rows={2}
                className="w-full border border-terre-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mousse-400 resize-none"
              />
              <input
                type="text"
                value={newCollectif.contact}
                onChange={e => setNewCollectif(p => ({ ...p, contact: e.target.value }))}
                placeholder="Contact ou lien (optionnel)"
                className="w-full border border-terre-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mousse-400"
              />
              <div>
                <p className="text-xs text-terre-500 mb-2">Ce collectif répond à quel(s) manque(s) ?</p>
                <div className="flex flex-wrap gap-1.5">
                  {MANQUES.map(m => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => toggleManqueForCollectif(m.key)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        newCollectif.manque_keys.includes(m.key)
                          ? 'bg-mousse-600 text-white border-mousse-600'
                          : 'bg-white text-terre-600 border-terre-200 hover:border-mousse-400'
                      }`}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              </div>
              {!profile?.maille?.center_lat && (
                <p className="text-xs text-amber-600">
                  Complète l'étape 1 (ta maille) pour localiser ce collectif.
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={createCollectif}
                  disabled={!newCollectif.nom.trim() || !profile?.maille?.center_lat || addCollectifSaving}
                  className="bg-mousse-600 hover:bg-mousse-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {addCollectifSaving ? 'Ajout…' : 'Ajouter ce collectif'}
                </button>
                <button
                  onClick={() => { setShowAddCollectif(false); setNewCollectif({ nom: '', description: '', contact: '', manque_keys: [] }) }}
                  className="text-terre-400 hover:text-terre-600 text-sm px-3 py-2"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddCollectif(true)}
              className="mt-4 text-sm text-terre-400 hover:text-mousse-600 transition-colors"
            >
              + Renseigner un collectif que tu connais
            </button>
          )}
        </section>

        {/* Card 3: Compétences */}
        <section className="bg-white rounded-2xl border border-terre-200 p-6 mb-6">
          <h2 className="font-serif text-terre-800 text-xl mb-4">
            <span className="text-terre-300 mr-2">03</span> Ton art
          </h2>
          {primaryComp ? (
            <div className="flex items-start gap-4">
              <span className="text-4xl">{primaryComp.icon}</span>
              <div>
                <p className="font-semibold text-terre-800">{primaryComp.label}</p>
                <p className="text-sm text-terre-500 mt-1">{primaryComp.description}</p>
                {profile?.competences?.skills_free && profile.competences.skills_free.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {profile.competences.skills_free.map(s => (
                      <span key={s} className="text-xs bg-terre-100 text-terre-600 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
                {compAdvice && (
                  <div className="mt-4 pt-4 border-t border-terre-100">
                    <p className="font-medium text-terre-700 text-sm mb-1">{compAdvice.title}</p>
                    <p className="text-sm text-terre-500 leading-relaxed">{compAdvice.text}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link href="/parcours/3-competences" className="text-mousse-600 hover:underline text-sm">
              → Identifier tes compétences
            </Link>
          )}
        </section>

        {/* Card 4: Compagnons */}
        <section className="bg-white rounded-2xl border border-terre-200 p-6 mb-6">
          <h2 className="font-serif text-terre-800 text-xl mb-4">
            <span className="text-terre-300 mr-2">04</span> Tes compagnons
          </h2>
          {(profile?.compagnons ?? []).length > 0 ? (
            <div className="space-y-2">
              {profile!.compagnons.map((c, i) => (
                <div key={i} className="flex items-center gap-3 bg-terre-50 rounded-lg px-4 py-2.5">
                  <span className="text-terre-400">👤</span>
                  <div>
                    <p className="text-terre-800 font-medium text-sm">{c.name}</p>
                    {c.notes && <p className="text-terre-400 text-xs">{c.notes}</p>}
                  </div>
                </div>
              ))}
              {profile!.compagnons.length < 3 && (
                <p className="text-sm text-amber-600 mt-2">
                  Tu as {profile!.compagnons.length} compagnon{profile!.compagnons.length > 1 ? 's' : ''}.
                  Essaie d'en trouver {3 - profile!.compagnons.length} de plus.
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-terre-500 mb-3">
                Si tu ne peux nommer aucune personne, le premier fil à tirer n'est pas le projet :
                c'est de trouver ces personnes.
              </p>
              <Link href="/parcours/4-compagnons" className="text-mousse-600 hover:underline text-sm">
                → Nommer tes compagnons
              </Link>
            </div>
          )}
        </section>

        {/* Matching personnes */}
        <section className="bg-terre-800 text-terre-100 rounded-2xl p-6 mb-6">
          <h2 className="font-serif text-xl mb-2">Personnes dans ta maille</h2>
          <p className="text-terre-400 text-sm mb-5">
            Ces personnes ont fait le parcours et se trouvent dans un rayon de 30 km autour de toi,
            avec des manques ou des envies qui se recoupent avec les tiens.
          </p>
          {matches.length > 0 ? (
            <div className="space-y-3">
              {matches.map(match => (
                <div key={match.user_id} className="bg-terre-700 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {match.share_name && match.display_name ? match.display_name : 'Anonyme'}
                      </p>
                      {match.distance_bucket && (
                        <p className="text-terre-400 text-xs mt-0.5">{match.distance_bucket}</p>
                      )}
                    </div>
                    {match.share_type && match.primary_type && (
                      <span className="text-xs bg-terre-600 px-2 py-1 rounded-full text-terre-300">
                        {COMPETENCES.find(c => c.type === match.primary_type)?.label ?? match.primary_type}
                      </span>
                    )}
                  </div>
                  {match.share_manques && match.manque_keys && match.manque_keys.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {match.manque_keys.map(key => {
                        const m = MANQUES.find(m => m.key === key)
                        return m ? (
                          <span key={key} className="text-xs bg-terre-600 text-terre-300 px-2 py-0.5 rounded-full">
                            {m.icon} {m.label}
                          </span>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-terre-700 rounded-xl p-5 text-center">
              <p className="text-terre-400 text-sm">
                Aucune personne trouvée dans un rayon de 30 km pour l'instant.
              </p>
              <p className="text-terre-500 text-xs mt-2">
                {profile?.visibility?.is_visible
                  ? 'Tu es visible - les autres te verront quand ils feront le parcours.'
                  : 'Active le matching dans l\'étape 4 pour apparaître chez les autres.'}
              </p>
            </div>
          )}
        </section>

        {/* Échanges de compétences */}
        <section className="bg-white rounded-2xl border border-terre-200 p-6 mb-6">
          <h2 className="font-serif text-terre-800 text-xl mb-1">
            <span className="text-terre-300 mr-2">⇄</span> Échanges de compétences
          </h2>
          <p className="text-sm text-terre-400 mb-5">
            Ce que tu proposes et ce que tu cherches - sans points, sans comptabilité.
            Un échange = une invitation à se contacter.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Tes offres */}
            <div>
              <p className="text-xs font-semibold text-terre-500 uppercase tracking-wide mb-2">Ce que tu proposes</p>
              <div className="space-y-2">
                {myOffres.map(e => (
                  <div key={e.id} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${e.actif ? 'bg-mousse-50 border border-mousse-200' : 'bg-terre-50 border border-terre-100 opacity-60'}`}>
                    <span className="flex-1 text-terre-700">{e.description}</span>
                    <button onClick={() => deleteEchange(e.id)} className="text-terre-300 hover:text-red-400 shrink-0 text-xs">×</button>
                  </div>
                ))}
                {myOffres.length === 0 && (
                  <p className="text-xs text-terre-400 italic">Aucune offre pour l'instant.</p>
                )}
              </div>
              {showAddEchange !== 'offre' && (
                <button
                  onClick={() => { setShowAddEchange('offre'); setNewEchangeDesc(''); setNewEchangeManque('') }}
                  className="mt-2 text-xs text-terre-400 hover:text-mousse-600 transition-colors"
                >
                  + Ajouter une offre
                </button>
              )}
            </div>

            {/* Tes demandes */}
            <div>
              <p className="text-xs font-semibold text-terre-500 uppercase tracking-wide mb-2">Ce que tu cherches</p>
              <div className="space-y-2">
                {myDemandes.map(e => (
                  <div key={e.id} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${e.actif ? 'bg-eau-50 border border-eau-200' : 'bg-terre-50 border border-terre-100 opacity-60'}`}>
                    <span className="flex-1 text-terre-700">{e.description}</span>
                    <button onClick={() => deleteEchange(e.id)} className="text-terre-300 hover:text-red-400 shrink-0 text-xs">×</button>
                  </div>
                ))}
                {myDemandes.length === 0 && (
                  <p className="text-xs text-terre-400 italic">Aucune demande pour l'instant.</p>
                )}
              </div>
              {showAddEchange !== 'demande' && (
                <button
                  onClick={() => { setShowAddEchange('demande'); setNewEchangeDesc(''); setNewEchangeManque('') }}
                  className="mt-2 text-xs text-terre-400 hover:text-mousse-600 transition-colors"
                >
                  + Ajouter une demande
                </button>
              )}
            </div>
          </div>

          {/* Inline form (offre ou demande) */}
          {showAddEchange && (
            <div className="bg-terre-50 border border-terre-200 rounded-xl p-4 space-y-3 mb-4">
              <p className="text-sm font-medium text-terre-700">
                {showAddEchange === 'offre' ? 'Ce que tu proposes' : 'Ce que tu cherches'}
              </p>
              <textarea
                value={newEchangeDesc}
                onChange={e => setNewEchangeDesc(e.target.value)}
                placeholder={showAddEchange === 'offre'
                  ? 'Ex : Je peux aider à réparer des vélos, tenir un potager…'
                  : 'Ex : Cherche quelqu\'un pour m\'aider à rénover une toiture…'}
                rows={2}
                className="w-full border border-terre-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mousse-400 resize-none"
              />
              <select
                value={newEchangeManque}
                onChange={e => setNewEchangeManque(e.target.value)}
                className="w-full border border-terre-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-mousse-400"
              >
                <option value="">- Lier à un manque (optionnel) -</option>
                {MANQUES.map(m => (
                  <option key={m.key} value={m.key}>{m.icon} {m.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={createEchange}
                  disabled={!newEchangeDesc.trim() || addEchangeSaving}
                  className="bg-mousse-600 hover:bg-mousse-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {addEchangeSaving ? 'Ajout…' : 'Ajouter'}
                </button>
                <button
                  onClick={() => setShowAddEchange(null)}
                  className="text-terre-400 hover:text-terre-600 text-sm px-3 py-2"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Nearby échanges des voisins */}
          {(nearbyDemandes.length > 0 || nearbyOffres.length > 0) && (
            <div className="pt-4 border-t border-terre-100">
              <p className="text-xs font-semibold text-terre-500 uppercase tracking-wide mb-3">Dans ta zone</p>
              <div className="space-y-2">
                {[...nearbyDemandes, ...nearbyOffres].map(e => {
                  const manque = e.manque_key ? MANQUES.find(m => m.key === e.manque_key) : null
                  return (
                    <div key={e.id} className="flex items-start gap-3 bg-terre-50 rounded-lg px-3 py-2.5 text-sm">
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                        e.direction === 'demande' ? 'bg-eau-100 text-eau-700' : 'bg-mousse-100 text-mousse-700'
                      }`}>
                        {e.direction === 'demande' ? 'cherche' : 'propose'}
                      </span>
                      <div className="flex-1">
                        <p className="text-terre-700">{e.description}</p>
                        <p className="text-terre-400 text-xs mt-0.5">
                          {e.display_name ?? 'Anonyme'} · {e.distance_label}
                          {manque ? ` · ${manque.icon} ${manque.label}` : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* La suite */}
        <section className="bg-mousse-600 text-white rounded-2xl p-6 mb-8">
          <p className="font-serif text-xl mb-2">La suite ne s'écrit pas ici.</p>
          <p className="text-mousse-100 leading-relaxed text-sm">
            Invite trois personnes à manger chez toi cette semaine.
            Pas pour leur présenter un projet. Pas pour les enrôler.
            Pour partager un repas et parler.
          </p>
        </section>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadSummary}
            className="flex items-center gap-2 bg-terre-700 hover:bg-terre-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            ⬇ Télécharger ma synthèse
          </button>
          <Link
            href="/parcours"
            className="flex items-center gap-2 border border-terre-200 text-terre-600 hover:border-terre-300 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            ← Modifier mes réponses
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 border border-terre-200 text-terre-600 hover:border-terre-300 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            ⌂ Accueil
          </Link>
        </div>

      </div>
    </main>
  )
}
