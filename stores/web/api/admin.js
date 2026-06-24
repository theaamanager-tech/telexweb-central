// POST /api/admin   { action, ...payload, password }
// One key-gated endpoint for ALL admin operations (service role).
// Password dikirim di body tiap request (disimpan di sessionStorage frontend).
import { admin, getConfig, readJson, cors } from "../lib/supabaseAdmin.js";
import { resetCentralConfig } from "../lib/central.js";

const ADMIN_KEY = process.env.ADMIN_KEY || "";
const BUCKET_CACHE = new Set();

async function ensureBucket(name) {
  if (BUCKET_CACHE.has(name)) return;
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.find((b) => b.id === name)) {
    await admin.storage.createBucket(name, { public: true });
  }
  BUCKET_CACHE.add(name);
}

function checkPassword(body) {
  const pw = String(body.password || "");
  return pw.length > 0 && pw === ADMIN_KEY;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = await readJson(req);
  const { action } = body;

  // Semua action perlu password valid, kecuali login (dia yg nerima password)
  if (action !== "login" && !checkPassword(body)) {
    return res.status(401).json({ error: "Password salah." });
  }

  try {
    // === LOGIN ===
    if (action === "login") {
      if (!ADMIN_KEY) return res.status(500).json({ error: "ADMIN_KEY belum diset di Vercel" });
      if (!body.password) return res.status(400).json({ error: "Password wajib" });
      if (!checkPassword(body)) return res.status(401).json({ error: "Password salah" });
      return res.json({ ok: true });
    }

    switch (action) {
      case "catalog": {
        const [productsRes, variantsRes] = await Promise.all([
          admin.from("products").select("*").order("sort_order", { ascending: true }),
          admin.from("variants").select("*").order("sort_order", { ascending: true }),
        ]);
        if (productsRes.error) throw productsRes.error;
        if (variantsRes.error) throw variantsRes.error;

        // TIDAK ADA query stock_items — stok dikelola via Central.
        // Di sini kita tampilkan data stok dari Central via catalog publik.
        // Untuk admin, kita tidak bisa query stock_items (table sudah dihapus).
        // Stok per variant ditampilkan 0 sebagai placeholder — real-time via catalog publik.
        const out = (productsRes.data || []).map((product) => ({
          ...product,
          variants: (variantsRes.data || [])
            .filter((variant) => variant.product_id === product.id)
            .map((variant) => ({
              ...variant,
              available: 0,
              sold: 0,
              stock_total: 0,
            })),
        }));
        return res.json({ products: out, synced_at: new Date().toISOString() });
      }

      /* ---------- products ---------- */
      case "save_product": {
        const { product } = body;
        const { error } = await admin.from("products").upsert({ ...product, updated_at: new Date().toISOString() });
        if (error) throw error; return res.json({ ok: true });
      }
      case "delete_product": {
        const { error } = await admin.from("products").delete().eq("id", body.id);
        if (error) throw error; return res.json({ ok: true });
      }

      /* ---------- variants ---------- */
      case "save_variant": {
        const { data, error } = await admin.from("variants").upsert(body.variant).select().single();
        if (error) throw error; return res.json({ variant: data });
      }
      case "delete_variant": {
        const { error } = await admin.from("variants").delete().eq("id", body.id);
        if (error) throw error; return res.json({ ok: true });
      }

      /* ---------- stock (DIHAPUS — stok via Central Panel) ---------- */
      // Actions list_stock, add_stock, delete_stock sudah dihapus.
      // Stok dikelola di Central Panel: https://central-panel.vercel.app

      /* ---------- variant SNK ---------- */
      case "save_snk": {
        const { error } = await admin.from("variants").update({ snk: body.snk }).eq("id", body.variant_id);
        if (error) throw error;
        return res.json({ ok: true });
      }

      /* ---------- coupons ---------- */
      case "list_coupons": {
        const { data, error } = await admin.from("coupons").select("*").order("created_at", { ascending: false });
        if (error) throw error; return res.json({ coupons: data });
      }
      case "save_coupon": {
        const c = body.coupon;
        const { error } = await admin.from("coupons").upsert({ ...c, code: c.code.toUpperCase() }, { onConflict: "code" });
        if (error) throw error; return res.json({ ok: true });
      }
      case "delete_coupon": {
        const { error } = await admin.from("coupons").delete().eq("id", body.id);
        if (error) throw error; return res.json({ ok: true });
      }

      /* ---------- central config (BARU) ---------- */
      case "get_central_config": {
        const cfg = await getConfig();
        return res.json({
          central_api_url: cfg.central_api_url || "https://central-panel.vercel.app",
          central_api_key_set: !!cfg.central_api_key,
          central_api_key_preview: cfg.central_api_key ? cfg.central_api_key.slice(0, 8) + "••••" : "",
        });
      }
      case "save_central_config": {
        const patch = { updated_at: new Date().toISOString() };
        if (body.central_api_url !== undefined) patch.central_api_url = body.central_api_url;
        if (body.central_api_key) patch.central_api_key = body.central_api_key;
        const { error } = await admin.from("app_config").update(patch).eq("id", 1);
        if (error) throw error;
        // Reset central cache biar next call pakai config baru
        resetCentralConfig();
        return res.json({ ok: true });
      }

      /* ---------- pakasir config ---------- */
      case "get_config": {
        const cfg = await getConfig();
        return res.json({ config: {
          pakasir_project: cfg.pakasir_project, pakasir_mode: cfg.pakasir_mode,
          webhook_url: cfg.webhook_url,
          api_key_set: !!cfg.pakasir_api_key,
          api_key_preview: cfg.pakasir_api_key ? cfg.pakasir_api_key.slice(0, 4) + "••••" : "",
          // Central config
          central_api_url: cfg.central_api_url || "https://central-panel.vercel.app",
          central_api_key_set: !!cfg.central_api_key,
          central_api_key_preview: cfg.central_api_key ? cfg.central_api_key.slice(0, 8) + "••••" : "",
          // Telegram
          telegram_bot_token: cfg.telegram_bot_token || '',
          telegram_chat_id: cfg.telegram_chat_id || '',
          mailersend_api_key: cfg.mailersend_api_key || '',
          mailersend_sender_email: cfg.mailersend_sender_email || '',
        }});
      }
      case "save_config": {
        const patch = { updated_at: new Date().toISOString() };
        if (body.pakasir_project !== undefined) patch.pakasir_project = body.pakasir_project;
        if (body.pakasir_mode !== undefined) patch.pakasir_mode = body.pakasir_mode;
        if (body.webhook_url !== undefined) patch.webhook_url = body.webhook_url;
        if (body.pakasir_api_key) patch.pakasir_api_key = body.pakasir_api_key;
        if (body.telegram_bot_token !== undefined) patch.telegram_bot_token = body.telegram_bot_token;
        if (body.telegram_chat_id !== undefined) patch.telegram_chat_id = body.telegram_chat_id;
        if (body.mailersend_api_key !== undefined) patch.mailersend_api_key = body.mailersend_api_key;
        if (body.mailersend_sender_email !== undefined) patch.mailersend_sender_email = body.mailersend_sender_email;
        const { error } = await admin.from("app_config").update(patch).eq("id", 1);
        if (error) throw error; return res.json({ ok: true });
      }

      /* ---------- insights ---------- */
      case "insights": {
        const { data: orders } = await admin.from("orders").select("*").eq("status", "paid");
        const paid = orders || [];
        const revenue = paid.reduce((a, o) => a + (o.amount || 0), 0);
        const byProduct = {};
        paid.forEach((o) => {
          const k = `${o.product_name} — ${o.variant_name}`;
          if (!byProduct[k]) byProduct[k] = { label: k, qty: 0, revenue: 0 };
          byProduct[k].qty += 1; byProduct[k].revenue += o.amount || 0;
        });
        const top = Object.values(byProduct).sort((a, b) => b.qty - a.qty).slice(0, 5);
        const { count: prodCount } = await admin.from("products").select("*", { count: "exact", head: true });
        // CATATAN: stock_items sudah tidak ada di DB lokal. available count tidak relevan.
        // Tampilkan jumlah varian aktif sebagai gantinya.
        const { count: variantCount } = await admin.from("variants").select("*", { count: "exact", head: true }).eq("active", true);
        return res.json({ insights: {
          revenue, orders: paid.length, prodCount: prodCount ?? 0, available: variantCount ?? 0, top,
        }});
      }

      /* ---------- rekap penjualan ---------- */
      case "list_orders": {
        // Auto-expire pending orders > 5 menit
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        await admin.from("orders")
          .update({ status: "expired" })
          .eq("status", "pending")
          .lt("created_at", fiveMinAgo);

        const { start_date, end_date } = body;
        let query = admin.from("orders").select("*").order("created_at", { ascending: false });
        if (start_date) query = query.gte("created_at", start_date);
        if (end_date) query = query.lte("created_at", end_date + "T23:59:59Z");
        const { data, error } = await query;
        if (error) throw error;
        const orders = (data || []).map((o) => ({ ...o }));
        const lunas = orders.filter((o) => o.status === "paid");
        const revenue = lunas.reduce((a, o) => a + (o.amount || 0), 0);
        return res.json({ orders, summary: {
          total_orders: orders.length, paid_orders: lunas.length,
          revenue, avg_order: lunas.length ? Math.round(revenue / lunas.length) : 0,
        }});
      }

      /* ---------- background management ---------- */
      case "bg_list": {
        const cfg = await getConfig();
        if (!cfg.bg_list || !cfg.bg_list.length) {
          // Seed default pake file lokal yang ada di repo
          const defaultBg = [
            { id: "bg-8", file: "/bg/b793c9d5-f879-4368-b76b-db31829d324e-1.webp", label: "Bg 1" },
            { id: "bg-9", file: "/bg/14e0665c-be4b-4b47-9fe6-5c965cb7bd2c-1.webp", label: "Bg 2" },
          ];
          await admin.from("app_config").update({ bg_list: defaultBg, updated_at: new Date().toISOString() }).eq("id", 1);
          return res.json({ backgrounds: defaultBg });
        }
        return res.json({ backgrounds: cfg.bg_list });
      }
      case "bg_save": {
        const { id, file, label, active } = body;
        if (!file || !label) return res.status(400).json({ error: "File & label wajib" });
        const cfg = await getConfig();
        const bgList = JSON.parse(JSON.stringify(cfg.bg_list || []));
        const idx = bgList.findIndex((b) => b.id === id);
        const newItem = { id: id || `bg-${Date.now()}`, file, label };
        if (active !== undefined) newItem.active = active;
        if (idx >= 0) { bgList[idx] = { ...bgList[idx], ...newItem }; } else { bgList.push(newItem); }
        await admin.from("app_config").update({ bg_list: bgList, updated_at: new Date().toISOString() }).eq("id", 1);
        return res.json({ ok: true, backgrounds: bgList });
      }
      case "bg_delete": {
        const { id } = body;
        if (!id) return res.status(400).json({ error: "id wajib" });
        const cfg = await getConfig();
        const bgList = (cfg.bg_list || []).filter((b) => b.id !== id);
        await admin.from("app_config").update({ bg_list: bgList, updated_at: new Date().toISOString() }).eq("id", 1);
        return res.json({ ok: true, backgrounds: bgList });
      }
      case "upload_bg_image": {
        const { file_data, url, filename } = body;
        let buffer, contentType, ext;

        if (url) {
          const imgRes = await fetch(url);
          if (!imgRes.ok) return res.status(400).json({ error: "Gagal download gambar dari URL" });
          buffer = Buffer.from(await imgRes.arrayBuffer());
          contentType = imgRes.headers.get("content-type") || "image/jpeg";
          ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
        } else if (file_data) {
          const raw = file_data.replace(/^data:image\/\w+;base64,/, "");
          buffer = Buffer.from(raw, "base64");
          contentType = file_data.startsWith("data:") ? file_data.split(";")[0].split(":")[1] : "image/jpeg";
          ext = (filename || "bg.jpg").split(".").pop()?.toLowerCase() || "jpg";
          if (buffer.length > 3 * 1024 * 1024) return res.status(400).json({ error: "Maks 3MB" });
        } else {
          return res.status(400).json({ error: "Kirim file_data (base64) atau url" });
        }

        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
        if (!allowed.includes(contentType)) return res.status(400).json({ error: "Tipe harus JPG/PNG/WEBP/GIF/AVIF" });
        if (buffer.length > 5 * 1024 * 1024) return res.status(400).json({ error: "Maks 5MB" });

        await ensureBucket("bg-images");
        const fileName = `bg-${Date.now()}.${ext}`;
        const { error: uploadErr } = await admin.storage.from("bg-images").upload(fileName, buffer, { contentType, upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = admin.storage.from("bg-images").getPublicUrl(fileName);
        return res.json({ image_url: publicUrl, ok: true });
      }

      /* ---------- upload image ---------- */
      case "upload_image": {
        const { product_id, file_data, url, filename } = body;
        if (!product_id) return res.status(400).json({ error: "product_id required" });

        let buffer, contentType, ext;

        if (url) {
          try { new URL(url); } catch { return res.status(400).json({ error: "URL tidak valid" }); }
          const imgRes = await fetch(url);
          if (!imgRes.ok) return res.status(400).json({ error: "Gagal download gambar dari URL" });
          buffer = Buffer.from(await imgRes.arrayBuffer());
          contentType = imgRes.headers.get("content-type") || "image/jpeg";
          ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
        } else if (file_data) {
          const raw = file_data.replace(/^data:image\/\w+;base64,/, "");
          buffer = Buffer.from(raw, "base64");
          contentType = file_data.startsWith("data:") ? file_data.split(";")[0].split(":")[1] : "image/jpeg";
          ext = (filename || "image.jpg").split(".").pop()?.toLowerCase() || "jpg";
          if (buffer.length > 3 * 1024 * 1024) return res.status(400).json({ error: "Maks 3MB" });
        } else {
          return res.status(400).json({ error: "Kirim file_data (base64) atau url" });
        }

        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
        if (!allowed.includes(contentType)) return res.status(400).json({ error: "Tipe harus JPG/PNG/WEBP/GIF/AVIF" });
        if (buffer.length > 5 * 1024 * 1024) return res.status(400).json({ error: "Maks 5MB" });

        await ensureBucket("product-images");
        const fileName = `${product_id}-${Date.now()}.${ext}`;
        const { error: uploadErr } = await admin.storage.from("product-images").upload(fileName, buffer, { contentType, upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = admin.storage.from("product-images").getPublicUrl(fileName);
        const { error: updateErr } = await admin.from("products").update({ image_url: publicUrl, updated_at: new Date().toISOString() }).eq("id", product_id);
        if (updateErr) throw updateErr;
        return res.json({ image_url: publicUrl, ok: true });
      }

      /* ---------- test central connection (BARU) ---------- */
      case "test_central": {
        const { sku } = body;
        if (!sku) return res.status(400).json({ error: "SKU diperlukan untuk test" });
        try {
          const { checkStock } = await import("../lib/central.js");
          const result = await checkStock(sku);
          if (!result) {
            return res.json({ ok: false, error: `SKU ${sku} tidak ditemukan di Central` });
          }
          return res.json({
            ok: true,
            sku: result.sku,
            stok_tersedia: result.stok_tersedia,
            stok_terjual: result.stok_terjual,
          });
        } catch (e) {
          return res.json({ ok: false, error: e.message });
        }
      }

      default:
        return res.status(400).json({ error: "Unknown action: " + action });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}
