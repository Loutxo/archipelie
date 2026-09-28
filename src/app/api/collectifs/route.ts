import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const radius = parseFloat(new URL(req.url).searchParams.get('radius') ?? '30')
  const { data, error } = await supabase.rpc('find_nearby_collectifs', { p_radius_km: radius })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ collectifs: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  if (action === 'create') {
    if (!body.nom?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    if (!body.lat || !body.lng) return NextResponse.json({ error: 'Position requise' }, { status: 400 })

    const { data: collectif, error } = await supabase
      .from('collectifs')
      .insert({
        nom: String(body.nom).slice(0, 100),
        description: body.description ? String(body.description).slice(0, 500) : null,
        manque_keys: (body.manque_keys ?? []).slice(0, 12),
        contact: body.contact ? String(body.contact).slice(0, 200) : null,
        center_lat: body.lat,
        center_lng: body.lng,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('collectif_membres').insert({
      collectif_id: collectif.id,
      user_id: user.id,
    })

    return NextResponse.json({ success: true, collectif_id: collectif.id })
  }

  if (action === 'join') {
    const { error } = await supabase.from('collectif_membres').upsert(
      { collectif_id: body.collectif_id, user_id: user.id },
      { onConflict: 'collectif_id,user_id' }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'leave') {
    const { error } = await supabase
      .from('collectif_membres')
      .delete()
      .eq('collectif_id', body.collectif_id)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
