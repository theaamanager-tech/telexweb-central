import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('master_products')
    .select('*')
    .order('sort_order')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, description, image_url, cat } = body

  if (!name) {
    return Response.json({ error: 'Nama produk diperlukan' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('master_products')
    .insert({ name, description, image_url, cat })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}
