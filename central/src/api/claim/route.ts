import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')

  if (!apiKey) {
    return Response.json({ success: false, error: 'API key diperlukan' }, { status: 401 })
  }

  // Validasi API key
  const { data: keyData, error: keyErr } = await supabaseAdmin
    .from('api_keys')
    .select('store_name, store_type')
    .eq('key', apiKey)
    .eq('active', true)
    .single()

  if (keyErr || !keyData) {
    return Response.json({ success: false, error: 'API key tidak valid' }, { status: 403 })
  }

  const body = await request.json()
  const { sku, order_ref } = body

  if (!sku) {
    return Response.json({ success: false, error: 'SKU diperlukan' }, { status: 400 })
  }

  // Panggil function claim_stock di Supabase
  const { data, error } = await supabaseAdmin.rpc('claim_stock', {
    p_sku: sku.toUpperCase(),
    p_api_key: apiKey,
    p_order_ref: order_ref || '',
  })

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }

  if (!data) {
    return Response.json({
      success: false,
      error: 'Stok habis',
      credential: null,
    })
  }

  return Response.json({
    success: true,
    credential: data,
    sku: sku.toUpperCase(),
  })
}
