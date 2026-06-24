// POST /api/create-payment  { variant_id, quantity?, coupon?, contact?, note? }
// Computes price server-side, validates coupon + stock (via Central API),
// creates a pending order, then creates a Pakasir QRIS transaction.
import { admin, getConfig, readJson, cors } from "../lib/supabaseAdmin.js";
import { createQris, payPageUrl } from "../lib/pakasir.js";
import { checkStock } from "../lib/central.js";

function genOrderId() {
  const d = new Date();
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, "");
  const rnd = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `NOV${ymd}${rnd}`;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { variant_id, quantity, coupon, contact, note } = await readJson(req);
    if (!variant_id) return res.status(400).json({ error: "variant_id wajib" });
    const qty = Math.max(1, Math.min(Number(quantity) || 1, 999)); // max 999

    // price + product info (service role)
    const { data: variant, error: vErr } = await admin
      .from("variants").select("*, products(name)").eq("id", variant_id).single();
    if (vErr || !variant) return res.status(404).json({ error: "Variasi tidak ditemukan" });
    if (variant.price == null) return res.status(400).json({ error: "Variasi ini harus chat admin" });

    // Stock check via Central API
    if (variant.sku) {
      try {
        const stockInfo = await checkStock(variant.sku);
        const available = stockInfo?.stok_tersedia ?? 0;
        if (available < qty) {
          return res.status(409).json({
            error: `Stok tersedia ${available}, tidak cukup untuk ${qty}.`,
            stok_tersedia: available,
          });
        }
      } catch (e) {
        // If Central is unreachable, still allow but log warning
        console.warn("[create-payment] Central stock check failed, proceeding:", e.message);
      }
    } else {
      // Variant tanpa SKU — tidak bisa cek stok Central
      return res.status(400).json({ error: "Variant ini belum punya SKU. Mapping dulu di admin." });
    }

    // coupon validation
    let discount = 0, couponCode = null;
    const baseAmount = variant.price * qty;
    if (coupon) {
      const { data: c } = await admin.from("coupons")
        .select("*").eq("code", coupon.toUpperCase()).eq("active", true).single();
      if (!c) return res.status(400).json({ error: "Kupon tidak valid" });
      if (c.max_uses > 0 && c.used_count >= c.max_uses) return res.status(400).json({ error: "Kupon sudah habis" });
      discount = c.type === "percent" ? Math.round((baseAmount * c.value) / 100) : c.value;
      discount = Math.min(discount, baseAmount);
      couponCode = c.code;
    }
    const amount = Math.max(baseAmount - discount, 1);

    // Pakasir config
    const cfg = await getConfig();
    if (!cfg.pakasir_project || !cfg.pakasir_api_key) {
      return res.status(500).json({ error: "Pakasir belum dikonfigurasi di admin" });
    }

    const orderId = genOrderId();
    let payment;
    try {
      payment = await createQris({
        project: cfg.pakasir_project, apiKey: cfg.pakasir_api_key, orderId, amount,
      });
    } catch (e) {
      return res.status(502).json({ error: "Gagal membuat QRIS: " + e.message });
    }

    await admin.from("orders").insert({
      order_id: orderId, variant_id, product_name: variant.products?.name || "",
      variant_name: variant.name, unit_price: variant.price, discount, amount,
      quantity: qty, coupon_code: couponCode, status: "pending", payment_method: "qris",
      qr_string: payment.payment_number, buyer_contact: contact || "", buyer_note: note || "",
    });

    return res.status(200).json({
      order_id: orderId,
      qr_string: payment.payment_number,
      amount,
      total_payment: payment.total_payment ?? amount,
      fee: payment.fee ?? 0,
      expired_at: payment.expired_at,
      pay_url: payPageUrl({ project: cfg.pakasir_project, amount, orderId }),
      product_name: variant.products?.name || "",
      variant_name: variant.name,
      discount,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}
