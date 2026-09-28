'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { COMPETENCES } from '@/lib/constants'
import SkillPicker from '@/components/SkillPicker'
import type { CompetenceType } from '@/types'

export default function CompetencesPage() {
  const [primary, setPrimary] = useState<CompetenceType | null>(null)
  const [secondary, setSecondary] = useState<CompetenceType | null>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [learningSkills, setLearningSkills] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        const c = data.competences
        if (!c) return
        if (c.primary_type) setPrimary(c.primary_type)
        if (c.secondary_type) setSecondary(c.secondary_type)
        if (c.skills_free?.length) setSkills(c.skills_free)
        if (c.learning_intent) {
          try {
            const parsed = JSON.parse(c.learning_intent)
            setLearningSkills(Array.isArray(parsed) ? parsed : c.learning_intent.split(', ').filter(Boolean))
          } catch {
            setLearningSkills(c.learning_intent.split(', ').filter(Boolean))
          }
        }
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'competences',
        data: {
          primary_type: primary,
          secondary_type: secondary,
          skills_free: skills,
          learning_intent: JSON.stringify(learningSkills),
        },
      }),
    })
    setSaving(false)
    router.push('/parcours/4-compagnons')
  }

  return (
    <main className="min-h-screen bg-terre-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-terre-400 text-sm mb-4">
            <Link href="/parcours" className="hover:text-mousse-600">Parcours</Link>
            <span>›</span>
            <span>Étape 3 sur 4</span>
          </div>
          <h1 className="text-3xl font-serif text-terre-800 mb-3">Que sais-tu faire ?</h1>
          <p className="text-terre-600 leading-relaxed">
            Non pas ton métier - ton art, au sens large. Parmi les cinq types de tisseurs du commun,
            lequel te ressemble le plus ? Pas de hiérarchie entre eux : chacun est indispensable.
          </p>
        </div>

        {/* Primary type */}
        <h2 className="font-serif text-terre-700 text-lg mb-3">Ton type principal</h2>
        <div className="space-y-3 mb-8">
          {COMPETENCES.map(comp => {
            const isSelected = primary === comp.type
            return (
              <button
                key={comp.type}
                onClick={() => {
                  setPrimary(comp.type)
                  if (secondary === comp.type) setSecondary(null)
                }}
                className={`w-full text-left rounded-xl border p-5 transition-all ${
                  isSelected
                    ? 'border-mousse-400 bg-mousse-50 shadow-sm'
                    : 'border-terre-200 bg-white hover:border-terre-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl shrink-0">{comp.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`font-semibold ${isSelected ? 'text-mousse-800' : 'text-terre-800'}`}>
                        {comp.label}
                      </p>
                      {isSelected && <span className="text-mousse-500">✓</span>}
                    </div>
                    <p className="text-sm text-terre-500 leading-relaxed">{comp.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {comp.examples.map(ex => (
                        <span key={ex} className="text-xs bg-terre-100 text-terre-500 px-2 py-0.5 rounded-full">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Secondary type */}
        {primary && (
          <div className="mb-8">
            <h2 className="font-serif text-terre-700 text-lg mb-1">
              Un type secondaire ?{' '}
              <span className="text-terre-400 font-normal text-base">(optionnel)</span>
            </h2>
            <p className="text-sm text-terre-500 mb-3">
              Beaucoup de gens portent deux arts. Si tu en as un second, choisis-le ici.
            </p>
            <div className="flex flex-wrap gap-2">
              {COMPETENCES.filter(c => c.type !== primary).map(comp => (
                <button
                  key={comp.type}
                  onClick={() => setSecondary(prev => prev === comp.type ? null : comp.type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-colors ${
                    secondary === comp.type
                      ? 'bg-terre-700 text-white border-terre-700'
                      : 'bg-white text-terre-600 border-terre-200 hover:border-terre-300'
                  }`}
                >
                  {comp.icon} {comp.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Skills picker */}
        <div className="mb-8 bg-white rounded-2xl border border-terre-200 p-6">
          <h2 className="font-serif text-terre-700 text-lg mb-1">Tes savoir-faire concrets</h2>
          <p className="text-sm text-terre-500 mb-4">
            Coche ce que tu sais vraiment faire - ce que tu pourrais proposer à quelqu'un demain.
          </p>
          <SkillPicker
            selected={skills}
            onChange={setSkills}
            customPlaceholder="Un autre savoir-faire…"
          />
          {skills.length > 0 && (
            <p className="text-xs text-mousse-600 mt-4 font-medium">
              {skills.length} savoir-faire sélectionné{skills.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Learning intent picker */}
        <div className="mb-8 bg-white rounded-2xl border border-terre-200 p-6">
          <h2 className="font-serif text-terre-700 text-lg mb-1">Qu'es-tu prêt·e à apprendre ?</h2>
          <p className="text-sm text-terre-500 mb-4">
            Dans le prolongement de ce que tu sais déjà - ce que tu pourrais envisager d'apprendre avec ou grâce à quelqu'un.
          </p>
          <SkillPicker
            selected={learningSkills}
            onChange={setLearningSkills}
            customPlaceholder="Autre chose à apprendre…"
          />
          {learningSkills.length > 0 && (
            <p className="text-xs text-mousse-600 mt-4 font-medium">
              {learningSkills.length} item{learningSkills.length > 1 ? 's' : ''} sélectionné{learningSkills.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-mousse-600 hover:bg-mousse-700 disabled:opacity-40 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            {saving ? 'Sauvegarde…' : 'Enregistrer et continuer →'}
          </button>
          <Link href="/parcours/2-manques" className="text-terre-400 hover:text-terre-600 text-sm">
            ← Retour
          </Link>
        </div>
      </div>
    </main>
  )
}
