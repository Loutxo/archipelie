import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Planification : Supabase Dashboard > Edge Functions > Schedule : "0 8 * * 1"
//   → tous les lundis à 8h. Rien ne se passe si aucun croisement n'est détecté.
//
// Variables d'environnement requises :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY  (https://resend.com - plan gratuit : 3 000 emails/mois)
//   SITE_URL        (ex : https://archipelie.tomorrode.be)

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://archipelie.tomorrode.be'

async function sendEmail(to: string, subject: string, text: string) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY non configuré - email non envoyé à', to)
    return
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Archipelie <noreply@tomorrode.be>',
      to,
      subject,
      text,
    }),
  })
}

Deno.serve(async () => {
  // 1. Tous les utilisateurs visibles qui veulent des notifications
  const { data: users, error: usersErr } = await supabase
    .from('matching_visibility')
    .select('user_id')
    .eq('is_visible', true)
    .eq('notify_email', true)

  if (usersErr || !users) {
    console.error('Erreur users:', usersErr)
    return new Response('error', { status: 500 })
  }

  let sent = 0

  for (const { user_id } of users) {
    // 2. Nouveaux collectifs proches dans les 7 derniers jours
    const { data: newCollectifs } = await supabase.rpc('find_nearby_collectifs_for_user', {
      p_user_id: user_id,
      p_radius_km: 30,
      p_since_days: 7,
    })

    // 3. Nouvelles personnes qui ont rejoint la carte
    const { data: newMatches } = await supabase.rpc('find_new_matches_for_user', {
      p_user_id: user_id,
      p_radius_km: 30,
      p_since_days: 7,
    })

    const hasNews = (newCollectifs?.length ?? 0) > 0 || (newMatches?.length ?? 0) > 0
    if (!hasNews) continue  // rien de nouveau → pas d'email

    // 4. Email de l'utilisateur via auth.admin
    const { data: userData } = await supabase.auth.admin.getUserById(user_id)
    if (!userData?.user?.email) continue

    const lines: string[] = ['Bonjour,\n\nQuelque chose a bougé dans ta maille.\n']

    if ((newCollectifs?.length ?? 0) > 0) {
      lines.push(`${newCollectifs!.length} initiative(s) proche(s) répondent à un de tes manques :`)
      for (const c of newCollectifs!) {
        lines.push(`  - ${c.nom}`)
      }
      lines.push('')
    }

    if ((newMatches?.length ?? 0) > 0) {
      lines.push(`${newMatches!.length} personne(s) près de toi ont rejoint la carte cette semaine.`)
      lines.push('')
    }

    lines.push('Rends-toi sur ta synthèse pour en savoir plus :')
    lines.push(`${SITE_URL}/synthese`)
    lines.push('\n-\nCet email est envoyé au plus une fois par semaine.')
    lines.push('Pour ne plus le recevoir, décoche l\'option dans l\'étape 4 du parcours.')

    await sendEmail(
      userData.user.email,
      'Archipelie - du nouveau dans ta maille',
      lines.join('\n')
    )
    sent++
  }

  const skipped = users.length - sent
  console.log(`Notifications envoyées : ${sent} | sans nouveauté : ${skipped}`)
  return new Response(JSON.stringify({ sent, skipped, total: users.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
