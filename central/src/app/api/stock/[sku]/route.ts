import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const sku = request.nextUrl.pathname.split('/').pop()
  const apiKey = request.headers.get('x-api-key')

  if (!apiKey) {
    return Response.json({ error: 'API key diperlukan' }, { status: 401 })
  }

  // Validasi API key
  const { data: keyData, error: keyErr } = await supabaseAdmin
    .from('api_keys')
    .select('store_name')
    .eq('key', apiKey)
    .eq('active', true)
    .single()

  if (keyErr || !keyData) {
    return Response.json({ error: 'API key tidak valid' }, { status: 403 })
  }

  if (!sku) {
    return Response.json({ error: 'SKU diperlukan' }, { status: 400 })
  }

  // Ambil stok summary
  const { data, error } = await supabaseAdmin
    .from('stock_summary')
    .select('*')
    .eq('sku', sku.toUpperCase())
    .single()

  if (error) {
    // Cek apakah SKU ada
    const { data: variant } = await supabaseAdmin
      .from('master_variants')
      .select('sku')
      .eq('sku', sku.toUpperCase())
      .single()

    if (!variant) {
      return Response.json({ error: 'SKU tidak ditemukan' }, { status: 404 })
    }

    return Response.json({
      sku: sku.toUpperCase(),
      stok_tersedia: 0,
      stok_terjual: 0,
      total_stok: 0,
    })
  }

  return Response.json(data)
}
