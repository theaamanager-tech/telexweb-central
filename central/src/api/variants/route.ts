import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('master_variants')
    .select('*')
    .order('sort_order')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { product_id, sku, name } = body

  if (!product_id || !sku || !name) {
    return Response.json({ error: 'Product ID, SKU, dan nama diperlukan' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('master_variants')
    .insert({
      product_id,
      sku: sku.toUpperCase(),
      name,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}
