'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // The recovery link puts the user in a temporary session before this page mounts.
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/parcours'), 1500)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-terre-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-serif text-terre-800 mb-3">Mot de passe mis à jour</h1>
          <p className="text-terre-600">On te redirige vers ton parcours...</p>
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
          <h1 className="text-2xl font-serif text-terre-800 mb-2 text-center">Choisir un nouveau mot de passe</h1>
          {!ready ? (
            <p className="text-terre-500 text-sm text-center mt-4">
              Ce lien a expiré ou n'est plus valide.{' '}
              <Link href="/auth/forgot-password" className="text-mousse-600 hover:underline">
                Redemander un lien
              </Link>
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div>
                <label className="block text-sm text-terre-600 mb-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full border border-terre-200 rounded-lg px-4 py-3 text-terre-800 focus:outline-none focus:ring-2 focus:ring-mousse-400"
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-mousse-600 hover:bg-mousse-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
