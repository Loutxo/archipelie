'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SignOutButton() {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button
      onClick={signOut}
      className="text-terre-400 hover:text-terre-600 text-sm transition-colors px-4 py-4"
    >
      Se déconnecter
    </button>
  )
}
