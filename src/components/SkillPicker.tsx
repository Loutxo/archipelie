'use client'
import { useState } from 'react'
import { SKILL_CATEGORIES } from '@/lib/constants'

const ALL_PREDEFINED = SKILL_CATEGORIES.flatMap(c => c.skills)

interface Props {
  selected: string[]
  onChange: (skills: string[]) => void
  customPlaceholder?: string
}

export default function SkillPicker({ selected, onChange, customPlaceholder = 'Autre savoir-faire…' }: Props) {
  const [customInput, setCustomInput] = useState('')

  function toggle(skill: string) {
    onChange(selected.includes(skill)
      ? selected.filter(s => s !== skill)
      : [...selected, skill]
    )
  }

  function addCustom() {
    const s = customInput.trim()
    if (s && !selected.includes(s)) {
      onChange([...selected, s])
    }
    setCustomInput('')
  }

  const customSelected = selected.filter(s => !ALL_PREDEFINED.includes(s))

  return (
    <div className="space-y-4">
      {SKILL_CATEGORIES.map(cat => {
        const count = cat.skills.filter(s => selected.includes(s)).length
        return (
          <div key={cat.label}>
            <p className="text-xs font-semibold text-terre-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              {count > 0 && (
                <span className="bg-mousse-100 text-mousse-700 text-xs font-normal px-1.5 py-0.5 rounded-full normal-case tracking-normal">
                  {count}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {cat.skills.map(skill => {
                const on = selected.includes(skill)
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggle(skill)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                      on
                        ? 'bg-mousse-600 text-white border-mousse-600'
                        : 'bg-white text-terre-600 border-terre-200 hover:border-mousse-400 hover:text-mousse-600'
                    }`}
                  >
                    {skill}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="pt-3 border-t border-terre-100 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
            placeholder={customPlaceholder}
            className="flex-1 border border-terre-200 rounded-lg px-3 py-2 text-sm text-terre-800 focus:outline-none focus:ring-2 focus:ring-mousse-400 bg-white"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="bg-terre-700 hover:bg-terre-800 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Ajouter
          </button>
        </div>
        {customSelected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {customSelected.map(skill => (
              <span key={skill} className="flex items-center gap-1 bg-terre-100 text-terre-700 text-xs px-2.5 py-1.5 rounded-full">
                {skill}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter(s => s !== skill))}
                  className="text-terre-400 hover:text-red-400 leading-none"
                >×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
