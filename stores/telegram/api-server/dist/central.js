// Central Stock API client for Jokowhy Telegram Bot
// Pure API functions — config is read inline in patched functions via getCentralConfig()
// No dependency on drizzle — uses raw SQL via db.$client for config lookup

let _centralCache = null;

export function resetCentralCache() {
  _centralCache = null;
}

/**
 * Read central_api_url and central_api_key from store_settings table via raw SQL.
 * Accepts db (the drizzle instance has .$client which is the raw pg Pool).
 */
export async function getCentralConfig(db) {
  if (_centralCache) return _centralCache;

  try {
    const { rows } = await db.$client.query(
      "SELECT key, value FROM store_settings WHERE key IN ('central_api_url','central_api_key')"
    );
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
    const url = (map.central_api_url || 'https://central-panel.vercel.app').replace(/\/+$/, '');
    const key = map.central_api_key || '';
    _centralCache = { url, key };
    return _centralCache;
  } catch (e) {
    console.error('[central] getCentralConfig error:', e.message);
    _centralCache = { url: 'https://central-panel.vercel.app', key: '' };
    return _centralCache;
  }
}

/**
 * GET /api/stock/[SKU]
 * Returns: { sku, stok_tersedia } or null
 */
export async function checkStock(sku, cfg) {
  if (!sku || typeof sku !== 'string') return null;

  const url = `${cfg.url}/api/stock/${encodeURIComponent(sku.toUpperCase())}`;

  try {
    const res = await fetch(url, {
      headers: { 'x-api-key': cfg.key },
      cache: 'no-store',
    });

    if (res.status === 404) return { sku, stok_tersedia: 0 };
    if (res.status === 401 || res.status === 403) {
      console.error('[central] Auth failed — check API key');
      return { sku, stok_tersedia: 0 };
    }
    if (!res.ok) return { sku, stok_tersedia: 0 };

    const data = await res.json();
    return {
      sku: data.sku || sku.toUpperCase(),
      stok_tersedia: data.stok_tersedia ?? 0,
    };
  } catch (e) {
    console.error('[central] checkStock error:', e.message);
    return { sku, stok_tersedia: 0 };
  }
}

/**
 * Batch check multiple SKUs
 * Returns Map<sku, { sku, stok_tersedia }>
 */
export async function checkStockBatch(skus, cfg) {
  const unique = [...new Set(skus.filter(Boolean).map(s => s.toUpperCase()))];
  if (!unique.length) return new Map();

  const results = await Promise.allSettled(unique.map(sku => checkStock(sku, cfg)));
  const map = new Map();

  unique.forEach((sku, i) => {
    if (results[i].status === 'fulfilled' && results[i].value) {
      map.set(sku, results[i].value);
    } else {
      map.set(sku, { sku, stok_tersedia: 0 });
    }
  });

  return map;
}

/**
 * POST /api/claim
 * Returns: { success, credential, error }
 */
export async function claimStock(sku, orderRef, cfg) {
  if (!sku) throw new Error('SKU diperlukan untuk claim');

  const url = `${cfg.url}/api/claim`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cfg.key,
      },
      body: JSON.stringify({
        sku: sku.toUpperCase(),
        order_ref: orderRef,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401 || res.status === 403) {
      throw new Error('Central API key tidak valid');
    }

    if (!res.ok) {
      if (data.error === 'Stok habis' || data.error?.toLowerCase().includes('habis')) {
        return { success: false, credential: null, error: 'Stok habis' };
      }
      throw new Error(data.error || `Central API error (${res.status})`);
    }

    if (!data.success && data.credential == null) {
      return { success: false, credential: null, error: data.error || 'Stok habis' };
    }

    return {
      success: true,
      credential: data.credential,
      sku: data.sku,
    };
  } catch (e) {
    if (e.message === 'Stok habis' || e.message?.toLowerCase().includes('habis')) {
      return { success: false, credential: null, error: 'Stok habis' };
    }
    throw e;
  }
}
