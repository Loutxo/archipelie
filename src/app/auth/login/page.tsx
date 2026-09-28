'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/parcours')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-terre-50 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center text-mousse-600 text-sm mb-8 hover:underline">
          ← Archipélie
        </Link>
        <div className="bg-white rounded-2xl border border-terre-200 shadow-sm p-8">
          <h1 className="text-2xl font-serif text-terre-800 mb-6 text-center">Se connecter</h1>
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
            <div>
              <label className="block text-sm text-terre-600 mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <p className="text-center text-terre-500 text-sm mt-4">
            <Link href="/auth/forgot-password" className="text-mousse-600 hover:underline">
              Mot de passe oublié ?
            </Link>
          </p>
          <p className="text-center text-terre-500 text-sm mt-2">
            Pas encore de compte ?{' '}
            <Link href="/auth/signup" className="text-mousse-600 hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
