import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [profile, maille, manques, competences, compagnons, visibility] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('maille').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('manques').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('competences').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('compagnons').select('*').eq('user_id', user.id),
    supabase.from('matching_visibility').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  return NextResponse.json({
    profile: profile.data,
    maille: maille.data,
    manques: manques.data,
    competences: competences.data,
    compagnons: compagnons.data ?? [],
    visibility: visibility.data,
  })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { step, data } = body

  const cap = (s: unknown, max: number) =>
    typeof s === 'string' ? s.slice(0, max) : s

  try {
    if (step === 'profile') {
      await supabase.from('profiles').upsert({
        id: user.id,
        display_name: cap(data.display_name, 100),
        bio: cap(data.bio, 300),
      })
    } else if (step === 'maille') {
      // Compute center from pins
      const pins = data.pins ?? []
      let center_lat: number | null = null
      let center_lng: number | null = null
      let radius_km: number | null = null
      let maille_type: string | null = null

      if (pins.length > 0) {
        center_lat = pins.reduce((s: number, p: { lat: number }) => s + p.lat, 0) / pins.length
        center_lng = pins.reduce((s: number, p: { lng: number }) => s + p.lng, 0) / pins.length

        // Compute max distance from center (bounding radius)
        const R = 6371 // Earth radius km
        const maxDist = Math.max(...pins.map((p: { lat: number; lng: number }) => {
          const dLat = (p.lat - center_lat!) * Math.PI / 180
          const dLng = (p.lng - center_lng!) * Math.PI / 180
          const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(center_lat! * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        }))
        radius_km = Math.round(maxDist * 10) / 10

        if (radius_km < 3) maille_type = 'dense'
        else if (radius_km < 10) maille_type = 'resserree'
        else maille_type = 'dispersee'
      }

      await supabase.from('maille').upsert({
        user_id: user.id,
        pins: data.pins,
        center_lat,
        center_lng,
        maille_type,
        radius_km,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    } else if (step === 'manques') {
      await supabase.from('manques').upsert({
        user_id: user.id,
        manque_keys: (data.manque_keys ?? []).slice(0, 20),
        notes: cap(data.notes, 500),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    } else if (step === 'competences') {
      await supabase.from('competences').upsert({
        user_id: user.id,
        primary_type: data.primary_type ?? null,
        secondary_type: data.secondary_type ?? null,
        skills_free: (data.skills_free ?? []).slice(0, 50).map((s: unknown) => cap(s, 100)),
        learning_intent: cap(data.learning_intent, 1000),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    } else if (step === 'compagnons') {
      await supabase.from('compagnons').delete().eq('user_id', user.id)
      if (data.compagnons?.length > 0) {
        await supabase.from('compagnons').insert(
          (data.compagnons as { name: string; notes: string }[])
            .slice(0, 20)
            .map(c => ({
              user_id: user.id,
              name: String(c.name ?? '').slice(0, 100),
              notes: String(c.notes ?? '').slice(0, 300),
            }))
        )
      }
    } else if (step === 'visibility') {
      await supabase.from('matching_visibility').upsert({
        user_id: user.id,
        ...data,
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
