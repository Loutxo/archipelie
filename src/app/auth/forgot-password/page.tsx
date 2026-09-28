'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-terre-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-4xl mb-4">📬</div>
          <h1 className="text-2xl font-serif text-terre-800 mb-3">Vérifie ta boîte mail</h1>
          <p className="text-terre-600">
            Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient de t'être envoyé.
          </p>
          <Link href="/auth/login" className="block mt-8 text-mousse-600 hover:underline text-sm">
            ← Retour à la connexion
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-terre-50 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center text-mousse-600 text-sm mb-8 hover:underline">
          ← Archipélie
        </Link>
        <div className="bg-white rounded-2xl border border-terre-200 shadow-sm p-8">
          <h1 className="text-2xl font-serif text-terre-800 mb-2 text-center">Mot de passe oublié</h1>
          <p className="text-terre-500 text-sm text-center mb-6">
            On t'envoie un lien pour en choisir un nouveau.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-terre-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-terre-200 rounded-lg px-4 py-3 text-terre-800 focus:outline-none focus:ring-2 focus:ring-mousse-400"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mousse-600 hover:bg-mousse-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </form>
          <p className="text-center text-terre-500 text-sm mt-6">
            <Link href="/auth/login" className="text-mousse-600 hover:underline">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
