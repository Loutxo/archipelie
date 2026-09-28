'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/parcours`,
        data: { display_name: name },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.user && !data.session) {
      // Email confirmation required
      setDone(true)
    } else {
      // Auto-confirmed (dev mode)
      if (name) {
        await supabase.from('profiles').upsert({ id: data.user!.id, display_name: name })
      }
      router.push('/parcours')
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-terre-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-4xl mb-4">📬</div>
          <h1 className="text-2xl font-serif text-terre-800 mb-3">Vérifie ta boîte mail</h1>
          <p className="text-terre-600">
            Un lien de confirmation t'a été envoyé à <strong>{email}</strong>.
            Clique dessus pour activer ton compte et commencer le parcours.
          </p>
          <Link href="/" className="block mt-8 text-mousse-600 hover:underline text-sm">
            ← Retour à l'accueil
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
          <h1 className="text-2xl font-serif text-terre-800 mb-2 text-center">Créer un compte</h1>
          <p className="text-terre-500 text-sm text-center mb-6">
            Pour sauvegarder ton parcours et rencontrer d'autres personnes dans ta maille.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-terre-600 mb-1">Ton prénom (ou pseudonyme)</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Comment les autres te verront"
                className="w-full border border-terre-200 rounded-lg px-4 py-3 text-terre-800 focus:outline-none focus:ring-2 focus:ring-mousse-400"
              />
            </div>
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
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
          <p className="text-center text-terre-500 text-sm mt-6">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-mousse-600 hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
