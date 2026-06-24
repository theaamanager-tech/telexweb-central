// Central Stock API client (server-side only)
// Reads config from local app_config (central_api_url + central_api_key),
// then calls Central Stock API for stock check and claim operations.
import { admin, getConfig } from "./supabaseAdmin.js";

// Cache central config setelah pertama kali fetch
let _centralConfig = null;
let _centralConfigPromise = null;

async function getCentralConfig() {
  if (_centralConfig) return _centralConfig;

  if (!_centralConfigPromise) {
    _centralConfigPromise = (async () => {
      try {
        const cfg = await getConfig();
        const url = (cfg.central_api_url || "https://central-panel.vercel.app").replace(/\/+$/, "");
        const key = cfg.central_api_key || "";
        if (!key) throw new Error("Central API key belum dikonfigurasi. Set di admin panel → Settings.");
        _centralConfig = { url, key };
        return _centralConfig;
      } catch (e) {
        _centralConfigPromise = null; // reset biar next call retry
        throw e;
      }
    })();
  }

  return _centralConfigPromise;
}

// Reset cache (dipanggil setelah save config)
export function resetCentralConfig() {
  _centralConfig = null;
  _centralConfigPromise = null;
}

// GET /api/stock/[SKU]
// Returns: { sku, stok_tersedia, stok_terjual, total_stok, product_name, variant_name }
// or null if SKU not found / error
export async function checkStock(sku) {
  if (!sku || typeof sku !== "string") return null;

  const cfg = await getCentralConfig();
  const url = `${cfg.url}/api/stock/${encodeURIComponent(sku.toUpperCase())}`;

  try {
    const res = await fetch(url, {
      headers: { "x-api-key": cfg.key },
      cache: "no-store",
    });

    if (res.status === 404) {
      // SKU tidak ditemukan di Central
      return null;
    }

    if (res.status === 401 || res.status === 403) {
      console.error("[central] Auth failed — check API key");
      return null;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error("[central] checkStock error:", res.status, body.error || body);
      return null;
    }

    const data = await res.json();
    return {
      sku: data.sku || sku.toUpperCase(),
      stok_tersedia: data.stok_tersedia ?? 0,
      stok_terjual: data.stok_terjual ?? 0,
      total_stok: data.total_stok ?? 0,
      product_name: data.product_name || "",
      variant_name: data.variant_name || "",
    };
  } catch (e) {
    console.error("[central] checkStock network error:", e.message);
    return null;
  }
}

// Batch check multiple SKUs
// Returns Map<sku, stockInfo>
export async function checkStockBatch(skus) {
  const unique = [...new Set(skus.filter(Boolean).map((s) => s.toUpperCase()))];
  if (!unique.length) return new Map();

  const results = await Promise.allSettled(unique.map((sku) => checkStock(sku)));
  const map = new Map();

  unique.forEach((sku, i) => {
    if (results[i].status === "fulfilled" && results[i].value) {
      map.set(sku, results[i].value);
    } else {
      map.set(sku, { sku, stok_tersedia: 0, stok_terjual: 0, total_stok: 0 });
    }
  });

  return map;
}

// POST /api/claim
// Returns: { success, credential, error } or throws
export async function claimStock(sku, orderRef = "") {
  if (!sku) throw new Error("SKU diperlukan untuk claim");

  const cfg = await getCentralConfig();
  const url = `${cfg.url}/api/claim`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cfg.key,
      },
      body: JSON.stringify({
        sku: sku.toUpperCase(),
        order_ref: orderRef,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401 || res.status === 403) {
      throw new Error("Central API key tidak valid. Cek admin panel.");
    }

    if (!res.ok) {
      if (data.error === "Stok habis" || data.error?.toLowerCase().includes("habis")) {
        return { success: false, credential: null, error: "Stok habis" };
      }
      throw new Error(data.error || `Central API error (${res.status})`);
    }

    if (!data.success && data.credential == null) {
      return { success: false, credential: null, error: data.error || "Stok habis" };
    }

    return {
      success: true,
      credential: data.credential,
      sku: data.sku,
    };
  } catch (e) {
    // Network error atau error lain
    if (e.message === "Stok habis" || e.message?.toLowerCase().includes("habis")) {
      return { success: false, credential: null, error: "Stok habis" };
    }
    throw e;
  }
}
