import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')

  if (!apiKey) {
    return Response.json({ success: false, error: 'API key diperlukan' }, { status: 401 })
  }

  // Validasi admin key
  if (apiKey !== process.env.ADMIN_KEY) {
    return Response.json({ success: false, error: 'Akses ditolak' }, { status: 403 })
  }

  const body = await request.json()
  const { sku, credentials } = body

  if (!sku || !credentials || !Array.isArray(credentials) || credentials.length === 0) {
    return Response.json({ success: false, error: 'SKU dan credentials diperlukan' }, { status: 400 })
  }

  // Cek apakah SKU valid
  const { data: variant } = await supabaseAdmin
    .from('master_variants')
    .select('sku')
    .eq('sku', sku.toUpperCase())
    .single()

  if (!variant) {
    return Response.json({ success: false, error: 'SKU tidak ditemukan' }, { status: 404 })
  }

  const rows = credentials.map((c: string) => ({
    sku: sku.toUpperCase(),
    credential: c.trim(),
  }))

  const { error } = await supabaseAdmin
    .from('stock_items')
    .insert(rows)

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }

  return Response.json({
    success: true,
    added: rows.length,
    sku: sku.toUpperCase(),
  })
}
