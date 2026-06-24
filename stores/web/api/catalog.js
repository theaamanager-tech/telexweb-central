// GET /api/catalog
// Public storefront catalog — stok dari Central Stock API.
// Products & variants dari database lokal, stock count dari Central per SKU.
import { admin, cors } from "../lib/supabaseAdmin.js";
import { checkStockBatch } from "../lib/central.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const [productsRes, variantsRes] = await Promise.all([
      admin.from("products").select("*").eq("active", true).order("sort_order", { ascending: true }),
      admin.from("variants").select("*").eq("active", true).order("sort_order", { ascending: true }),
    ]);

    if (productsRes.error) throw productsRes.error;
    if (variantsRes.error) throw variantsRes.error;

    // Kumpulin semua SKU unik untuk di-fetch dari Central
    const skus = [...new Set((variantsRes.data || []).map((v) => v.sku).filter(Boolean))];
    const stockMap = new Map();

    if (skus.length > 0) {
      try {
        const centralMap = await checkStockBatch(skus);
        // Merge: key by SKU
        centralMap.forEach((value, key) => {
          stockMap.set(key, value.stok_tersedia ?? 0);
        });
      } catch (e) {
        console.error("[catalog] Central stock fetch failed:", e.message);
        // stockMap tetap kosong → semua stok jadi 0
      }
    }

    const products = (productsRes.data || []).map((product) => ({
      ...product,
      variants: (variantsRes.data || [])
        .filter((variant) => variant.product_id === product.id)
        .map((variant) => ({
          ...variant,
          available: variant.sku ? (stockMap.get(variant.sku.toUpperCase()) ?? 0) : 0,
        })),
    }));

    return res.json({ products, synced_at: new Date().toISOString() });
  } catch (error) {
    console.error("[catalog]", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
