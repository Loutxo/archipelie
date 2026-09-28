import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const nearby = url.searchParams.get('nearby') === '1'
  const radius = parseFloat(url.searchParams.get('radius') ?? '15')

  if (nearby) {
    const { data, error } = await supabase.rpc('find_nearby_echanges', { p_radius_km: radius })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ echanges: data ?? [] })
  }

  const { data, error } = await supabase
    .from('echanges')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ echanges: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  if (action === 'create') {
    if (!['offre', 'demande'].includes(body.direction)) {
      return NextResponse.json({ error: 'Direction invalide' }, { status: 400 })
    }
    if (!body.description?.trim()) {
      return NextResponse.json({ error: 'Description requise' }, { status: 400 })
    }
    const { error } = await supabase.from('echanges').insert({
      user_id: user.id,
      direction: body.direction,
      description: String(body.description).trim().slice(0, 300),
      manque_key: body.manque_key || null,
      actif: true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'toggle') {
    const { error } = await supabase
      .from('echanges')
      .update({ actif: !!body.actif })
      .eq('id', body.id)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    const { error } = await supabase
      .from('echanges')
      .delete()
      .eq('id', body.id)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
