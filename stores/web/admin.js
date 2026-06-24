/* =====================================================================
 *  NOVACIY° — Admin logic (serverless, key-gated)
 *  All operations go through POST /api/admin with body password.
 *  Products • variant SNK • coupons • Pakasir cfg • Central Stock config • insights
 *
 *  CATATAN: Stok TIDAK dikelola lagi dari sini — semua stok via Central Panel.
 *  Halaman Stok & SNK hanya untuk edit SNK dan lihat info stok dari Central.
 * ===================================================================== */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const CAT_LABEL = { ai: "AI Tools", editing: "Editing", account: "Akun" };
const rupiah = (n) => (n == null ? "—" : "Rp " + Number(n).toLocaleString("id-ID"));
function priceRange(vs){const p=vs.map(v=>v.price).filter(v=>v!=null);if(!p.length)return"Chat Admin";const lo=Math.min(...p),hi=Math.max(...p);return lo===hi?rupiah(lo):rupiah(lo)+" – "+rupiah(hi);}

let ADMIN_PASSWORD = sessionStorage.getItem("nova_admin_password") || "";
let CATALOG = [], editingId = null, selectedVariant = null;

/* ===================== API ===================== */
async function api(action, payload = {}) {
  const body = { action, ...payload };
  if (action !== "login" && ADMIN_PASSWORD) body.password = ADMIN_PASSWORD;

  const r = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) {
    if (r.status === 401) { sessionStorage.removeItem("nova_admin_password"); ADMIN_PASSWORD = ""; showLoginGate(); }
    throw new Error(data.error || "Gagal");
  }
  return data;
}

function showLoginGate() {
  const gate = document.getElementById("loginGate");
  if (gate) gate.classList.remove("hidden");
}
function hideLoginGate() {
  const gate = document.getElementById("loginGate");
  if (gate) gate.classList.add("hidden");
}

function toast(msg, ok = true) {
  const t = $("#toast");
  t.innerHTML = `<i data-lucide="${ok ? "check-circle" : "alert-circle"}" class="w-4 ${ok ? "text-jadebright" : "text-red-300"}"></i><span>${msg}</span>`;
  t.classList.remove("opacity-0","translate-y-3"); lucide.createIcons();
  clearTimeout(window.__toast); window.__toast = setTimeout(()=>t.classList.add("opacity-0","translate-y-3"), 2600);
}

async function tryLogin() {
  const pass = $("#adminKey").value.trim();
  if (!pass) return toast("Masukkan password admin", false);
  try {
    await api("login", { password: pass });
    ADMIN_PASSWORD = pass;
    sessionStorage.setItem("nova_admin_password", ADMIN_PASSWORD);
    hideLoginGate();
    boot();
  } catch (e) { toast(e.message, false); }
}
$("#loginBtn")?.addEventListener("click", tryLogin);
$("#adminKey")?.addEventListener("keydown", (e)=>{ if(e.key==="Enter") tryLogin(); });
$("#logoutBtn")?.addEventListener("click", () => { sessionStorage.removeItem("nova_admin_password"); location.reload(); });

function startup() {
  if (ADMIN_PASSWORD) {
    hideLoginGate();
    boot();
  } else {
    showLoginGate();
  }
}
startup();

/* ===================== NAV ===================== */
const TITLES = { insights: "Insights & Finansial", rekap: "Rekap Penjualan", products: "Produk", stock: "Stok & SNK", coupons: "Kupon", settings: "Pakasir API", central: "Central Stock", store: "Pengaturan Toko" };
$$(".nav-item").forEach((b) => b.addEventListener("click", () => {
  try {
    $$(".nav-item").forEach(x => x.classList.remove("bg-jadebright/10","text-white"));
    b.classList.add("bg-jadebright/10","text-white");
    $$(".panel").forEach(p => p.classList.remove("active"));
    const panel = b.dataset.panel;
    const panelEl = $("#panel-" + panel);
    if (panelEl) panelEl.classList.add("active");
    $("#panelTitle").textContent = TITLES[panel] || panel;
    if (panel === "insights") loadInsights();
    if (panel === "rekap") { setDefaultDates(); loadRekap($("#rekapStart")?.value, $("#rekapEnd")?.value); }
    if (panel === "coupons") loadCoupons();
    if (panel === "settings") loadConfig();
    if (panel === "central") loadCentralConfig();
    if (panel === "store") { loadStoreConfig(); loadSocConfig(); }
    $("#sidebar")?.classList.add("-translate-x-full");
  } catch (e) { console.error("nav error:", e); toast(e.message, false); }
}));
$("#menuToggle")?.addEventListener("click", () => $("#sidebar")?.classList.toggle("-translate-x-full"));

/* ===================== ACCORDION ===================== */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".accord-btn");
  if (!btn) return;
  const targetId = btn.dataset.target;
  const body = document.getElementById(targetId);
  if (!body) return;
  const icon = btn.querySelector(".accord-icon");
  const isOpen = !body.classList.contains("hidden");
  body.classList.toggle("hidden");
  if (icon) {
    icon.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
  }
});

async function loadInsights() {
  try {
    const { insights: i } = await api("insights");
    $("#ovRevenue").textContent = rupiah(i.revenue);
    $("#ovOrders").textContent = i.orders;
    $("#ovProducts").textContent = i.prodCount;
    $("#ovStock").textContent = i.available;
    const max = Math.max(1, ...i.top.map((t) => t.qty));
    $("#topSellers").innerHTML = i.top.length ? i.top.map((t, idx) => `
      <div>
        <div class="flex items-center justify-between text-sm mb-1">
          <span class="text-white">${idx + 1}. ${t.label}</span>
          <span class="text-mint/50">${t.qty}x · ${rupiah(t.revenue)}</span>
        </div>
        <div class="h-2 rounded-full bg-mint/10 overflow-hidden"><div class="h-full bg-jadebright" style="width:${(t.qty / max) * 100}%"></div></div>
      </div>`).join("") : `<p class="text-mint/40 text-sm">Belum ada penjualan.</p>`;
  } catch (e) { toast(e.message, false); }
}

/* ===================== REKAP PENJUALAN ===================== */
async function loadRekap(startDate, endDate) {
  try {
    const { orders, summary } = await api("list_orders", { start_date: startDate, end_date: endDate });
    $("#rekapCount").textContent = `${(orders || []).length} pesanan`;
    $("#rkTotalOrders").textContent = summary.total_orders;
    $("#rkPaidOrders").textContent = summary.paid_orders;
    $("#rkRevenue").textContent = rupiah(summary.revenue);
    $("#rkAvg").textContent = rupiah(summary.avg_order);

    $("#rekapTable").innerHTML = (orders || []).length
      ? orders.map(o => `
        <tr class="border-b border-mint/5 hover:bg-mint/[.03]">
          <td class="p-3 text-xs font-mono text-mint/60">${o.order_id ? o.order_id.slice(0, 12) : '—'}</td>
          <td class="p-3 text-white">${o.product_name || '—'}</td>
          <td class="p-3 text-mint/60">${o.variant_name || '—'}</td>
          <td class="p-3 text-mint/60 text-xs">${o.buyer_contact ? o.buyer_contact.slice(0,25) : "—"}</td>
          <td class="p-3">${statusBadge(o.status)}</td>
          <td class="p-3 text-right font-mono text-white">${rupiah(o.amount)}</td>
          <td class="p-3 text-right text-mint/40 text-xs">${o.created_at ? new Date(o.created_at).toLocaleDateString('id-ID') : '—'}</td>
        </tr>`).join("")
      : `<tr><td colspan="7" class="p-8 text-center text-mint/40">Belum ada pesanan.</td></tr>`;
    lucide.createIcons();
  } catch (e) { toast(e.message, false); }
}
function statusBadge(status) {
  const m = { paid: ['Lunas', 'bg-jadebright/10 text-jadebright border-jadebright/30'], pending: ['Pending', 'bg-amber-400/10 text-amber-300 border-amber-400/30'], failed: ['Gagal', 'bg-red-400/10 text-red-300 border-red-400/30'], expired: ['Kadaluarsa', 'bg-mint/5 text-mint/50 border-mint/10'] };
  const [label, cls] = m[status] || [status, 'bg-mint/5 text-mint/50 border-mint/10'];
  return `<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cls}">${label}</span>`;
}
function setDefaultDates() {
  const today = new Date().toISOString().slice(0, 10);
  $("#rekapStart").value = today;
  $("#rekapEnd").value = today;
}
$("#rekapFilterBtn").addEventListener("click", () => loadRekap($("#rekapStart").value || undefined, $("#rekapEnd").value || undefined));
$("#rekapResetBtn").addEventListener("click", () => { setDefaultDates(); loadRekap($("#rekapStart").value, $("#rekapEnd").value); });

/* ===================== CATALOG / PRODUCTS ===================== */
async function loadCatalog({ refreshInsights = false } = {}) {
  try {
    const { products } = await api("catalog");
    CATALOG = Array.isArray(products) ? products : [];
    renderTable($("#prodSearch")?.value || "");
    renderVariantPicker();
    if (selectedVariant) renderStockManager();
    if (refreshInsights) await loadInsights();
  } catch (e) { toast(e.message, false); }
}
function renderTable(filter = "") {
  filter = filter.trim().toLowerCase();
  $("#productTable").innerHTML = CATALOG.filter((p) => p.name.toLowerCase().includes(filter)).map((p) => `
    <tr class="border-b border-mint/5 hover:bg-mint/[.03]">
      <td class="p-4"><div class="flex items-center gap-3">${p.image_url
  ? `<img src="${p.image_url}" class="w-9 h-9 rounded-lg object-cover" onerror="this.outerHTML='<div class=\'w-9 h-9 rounded-lg bg-jadebright/15 grid place-items-center text-xs font-bold text-jadebright\'>${p.initials}</div>'" />`
  : `<div class="w-9 h-9 rounded-lg bg-jadebright/15 grid place-items-center text-xs font-bold text-jadebright">${p.initials}</div>`}<span class="text-white">${p.name}</span></div></td>
      <td class="p-4 text-mint/60">${CAT_LABEL[p.cat] || p.cat}</td>
      <td class="p-4 text-mint/60">${p.variants.length} variasi</td>
      <td class="p-4 text-jadebright">${priceRange(p.variants)}</td>
      <td class="p-4"><div class="flex gap-2 justify-end"><button class="edit-prod p-2 rounded-lg hover:bg-mint/10" data-id="${p.id}"><i data-lucide="pencil" class="w-4"></i></button><button class="del-prod p-2 rounded-lg hover:bg-red-400/10 text-red-300" data-id="${p.id}"><i data-lucide="trash" class="w-4"></i></button></div></td>
    </tr>`).join("");
  lucide.createIcons();
  $$(".edit-prod").forEach((b) => b.addEventListener("click", () => openModal(CATALOG.find(p=>p.id===b.dataset.id))));
  $$(".del-prod").forEach((b) => b.addEventListener("click", async () => {
    const p = CATALOG.find(x=>x.id===b.dataset.id);
    if (confirm(`Hapus "${p.name}" beserta variasi & stok?`)) { try { await api("delete_product", { id: p.id }); toast("Produk dihapus"); loadCatalog({ refreshInsights: true }); } catch (err) { toast(err.message, false); } } }
  ));
}
$("#prodSearch").addEventListener("input", (e) => renderTable(e.target.value));

/* ===================== PRODUCT MODAL ===================== */
function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "p" + Date.now(); }

/* ---------- Image upload helpers ---------- */
function previewImage(url) {
  const box = $("#fImagePreview");
  if (url && url.trim()) {
    box.innerHTML = `<img src="${url}" class="w-full h-full object-contain" onerror="this.parentElement.innerHTML='<span class=\'text-red-300\'><i data-lucide=\'image-off\' class=\'w-5 inline\'></i> Gagal muat</span>'" />`;
  } else {
    box.innerHTML = `<span>Belum ada gambar</span>`;
  }
  lucide.createIcons();
}

async function uploadImageFile(productId, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      try {
        const data = await api("upload_image", {
          product_id: productId,
          file_data: base64,
          filename: file.name,
        });
        resolve(data.image_url);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("Gagal baca file"));
    reader.readAsDataURL(file);
  });
}

async function uploadImageUrl(productId, url) {
  const data = await api("upload_image", { product_id: productId, url: url });
  return data.image_url;
}

/* ⬇️ VARIANT ROW — tambah kolom SKU ⬇️ */
function variantRow(v = {}) {
  return `<div class="grid grid-cols-12 gap-2 variant-row" data-id="${v.id || ""}">
    <input class="v-name col-span-3 bg-ink/60 border border-mint/10 rounded-xl px-3 py-2 text-sm" placeholder="Nama" value="${v.name || ""}" />
    <input class="v-sku col-span-2 bg-ink/60 border border-mint/10 rounded-xl px-3 py-2 text-sm font-mono" placeholder="SKU" value="${v.sku || ""}" title="SKU yang terdaftar di Central Stock, cth: CC-7D" />
    <input class="v-price col-span-2 bg-ink/60 border border-mint/10 rounded-xl px-3 py-2 text-sm" type="number" placeholder="Harga" value="${v.price ?? ""}" />
    <input class="v-snk col-span-4 bg-ink/60 border border-mint/10 rounded-xl px-3 py-2 text-sm" placeholder="SNK" value="${v.snk || ""}" />
    <button class="v-del col-span-1 rounded-xl glass border border-mint/10 hover:bg-red-400/10 text-red-300"><i data-lucide="x" class="w-4 mx-auto"></i></button>
  </div>`;
}
function addVariantRow(v) { $("#variantRows").insertAdjacentHTML("beforeend", variantRow(v)); lucide.createIcons(); }
$("#addVariantBtn").addEventListener("click", () => addVariantRow());
$("#variantRows").addEventListener("click", async (e) => { if (e.target.closest(".v-del")) { e.preventDefault(); const row=e.target.closest(".variant-row"); const id=row.dataset.id; if(id && confirm("Hapus variasi ini?")) await api("delete_variant", { id }); row.remove(); } });

function openModal(p = null) {
  editingId = p?.id || null;
  $("#modalTitle").textContent = editingId ? "Edit Produk" : "Tambah Produk";
  $("#fName").value = p?.name || ""; $("#fCat").value = p?.cat || "ai";
  $("#fSubtitle").value = p?.subtitle || ""; $("#fInitials").value = p?.initials || "";
  $("#fActive").checked = p?.active ?? true; $("#variantRows").innerHTML = "";
  (p?.variants?.length ? p.variants : [{}]).forEach(addVariantRow);
  const img = p?.image_url || "";
  $("#fImageUrl").value = img;
  $("#fImageUrlHidden").value = img;
  previewImage(img);
  $("#modal").classList.remove("hidden");
}
function closeModal() { $("#modal").classList.add("hidden"); editingId = null; }
$("#addProductBtn").addEventListener("click", () => openModal());
$("#modalCancel").addEventListener("click", closeModal);

$("#fImageUrl").addEventListener("input", (e) => {
  const val = e.target.value.trim();
  previewImage(val);
  if (val) $("#fImageUrlHidden").value = val;
});

$("#fImageUpload").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const localUrl = URL.createObjectURL(file);
  previewImage(localUrl);
  toast("Gambar dipilih, simpan produk untuk upload...");
});

$("#fImageUrlBtn").addEventListener("click", () => {
  const url = $("#fImageUrl").value.trim();
  if (!url) return toast("Masukkan URL gambar dulu", false);
  previewImage(url);
  $("#fImageUrlHidden").value = url;
  toast("URL gambar diset");
});

$("#modalSave").addEventListener("click", async () => {
  const name = $("#fName").value.trim(); if (!name) return toast("Nama wajib", false);
  const productId = editingId || slugify(name);
  const product = { id: productId, name, cat: $("#fCat").value, subtitle: $("#fSubtitle").value.trim(), initials: $("#fInitials").value.trim() || name.slice(0,2).toUpperCase(), active: $("#fActive").checked };

  const fileInput = $("#fImageUpload");
  const imageUrlManual = $("#fImageUrl").value.trim();

  if (fileInput.files && fileInput.files[0]) {
    try {
      const imgUrl = await uploadImageFile(productId, fileInput.files[0]);
      product.image_url = imgUrl;
    } catch (e) {
      toast("Gambar gagal diupload, produk tetap disimpan tanpa gambar: " + e.message, false);
    }
  } else if (imageUrlManual) {
    product.image_url = imageUrlManual;
  }

  try {
    await api("save_product", { product });
    for (const row of $$(".variant-row")) {
      const existingId = row.dataset.id;
      const v = {
        id: existingId || undefined,
        product_id: product.id,
        name: $(".v-name",row).value.trim(),
        sku: $(".v-sku",row).value.trim().toUpperCase() || null,  // ⬅️ SKU!
        price: Number($(".v-price",row).value || 0),
        snk: $(".v-snk",row).value.trim(),
        active: true,
      };
      if (v.name) await api("save_variant", { variant: v });
    }
    toast(editingId ? "Produk diperbarui" : "Produk ditambahkan"); closeModal(); loadCatalog({ refreshInsights: true });
  } catch (e) { toast(e.message, false); }
});

/* ===================== STOCK / SNK (READ-ONLY STOCK + SNK EDITOR) ===================== */
function renderVariantPicker() {
  const groups = {};
  CATALOG.forEach(p => {
    p.variants.forEach(v => {
      if (!groups[p.id]) groups[p.id] = { product: p, variants: [] };
      groups[p.id].variants.push({...v, product_name: p.name});
    });
  });
  const ids = Object.keys(groups);
  if (!selectedVariant && ids.length) {
    const first = groups[ids[0]];
    selectedVariant = first.variants[0]?.id;
  }
  const isSelectedGroup = (pid) => groups[pid]?.variants.some(v => v.id === selectedVariant);

  $("#variantPicker").innerHTML = ids.length
    ? ids.map(pid => {
        const g = groups[pid];
        const open = isSelectedGroup(pid);
        return `<div class="variant-group glass border ${open ? 'border-jadebright/30' : 'border-mint/10'} rounded-xl overflow-hidden">
          <button class="vg-head w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-mint/5 transition" data-pid="${pid}">
            <span class="flex items-center gap-2"><span class="w-7 h-7 rounded-lg bg-jadebright/15 grid place-items-center text-xs font-bold text-jadebright">${g.product.initials}</span><b class="text-white">${g.product.name}</b></span>
            <i data-lucide="${open ? 'chevron-down' : 'chevron-right'}" class="w-4 text-mint/40 transition"></i>
          </button>
          <div class="flex flex-col gap-1 px-2 pb-2 ${open ? '' : 'hidden'}">
            ${g.variants.map(v => `<button class="vpick text-left rounded-xl px-3 py-2 border ${selectedVariant===v.id?'border-jadebright bg-jadebright/10 text-white':'border-transparent text-mint/70 hover:bg-mint/5'}" data-vid="${v.id}" data-sku="${v.sku || ''}">
              <span class="text-sm">${v.name}</span>
              ${v.sku ? `<span class="text-[10px] font-mono text-mint/40 ml-1">[${v.sku}]</span>` : ''}
              <span class="text-xs opacity-70">· stok via Central</span>
            </button>`).join('')}
          </div>
        </div>`;
      }).join('')
    : `<p class="text-sm text-mint/40">Belum ada variasi.</p>`;
  lucide.createIcons();
}
$("#variantPicker").addEventListener("click", (e) => {
  const pick = e.target.closest(".vpick");
  if (pick) { selectedVariant = pick.dataset.vid; renderVariantPicker(); renderStockManager(); return; }
  const head = e.target.closest(".vg-head");
  if (head) {
    const group = head.closest(".variant-group");
    const body = group.querySelector("div:last-child");
    const icon = head.querySelector("[data-lucide]");
    const isOpen = !body.classList.contains("hidden");
    body.classList.toggle("hidden");
    if (icon) { icon.setAttribute("data-lucide", isOpen ? "chevron-right" : "chevron-down"); }
    lucide.createIcons();
  }
});

async function renderStockManager() {
  const box = $("#stockManager");
  const variant = CATALOG.flatMap(p => p.variants.map(v => ({...v, product_name:p.name}))).find(v=>v.id===selectedVariant);
  if (!variant) { box.innerHTML = `<p class="text-mint/40 text-sm">Pilih variasi.</p>`; return; }
  box.innerHTML = `<div class="text-center text-mint/40 py-16"><i data-lucide="loader" class="w-8 mx-auto animate-spin"></i></div>`; lucide.createIcons();

  // Coba fetch stok dari Central
  let centralStock = null;
  if (variant.sku) {
    try {
      // Panggil test_central untuk lihat stok real-time
      const data = await api("test_central", { sku: variant.sku });
      if (data.ok) centralStock = data;
    } catch (e) {
      // Stok tidak tersedia — tampilkan info
    }
  }

  const noSku = !variant.sku;
  const stokText = noSku
    ? `<span class="text-xs bg-amber-400/10 text-amber-300 border border-amber-400/30 rounded-full px-3 py-1">Belum mapping SKU</span>`
    : centralStock
      ? `<span class="text-xs ${centralStock.stok_tersedia > 0 ? 'bg-jadebright/10 text-jadebright border-jadebright/30' : 'bg-red-400/10 text-red-300 border-red-400/30'} rounded-full px-3 py-1">${centralStock.stok_tersedia} tersedia</span>`
      : `<span class="text-xs bg-mint/5 text-mint/50 border border-mint/10 rounded-full px-3 py-1">Gagal muat stok</span>`;

  box.innerHTML = `
    <div class="glass border border-mint/10 rounded-2xl p-5 mb-4">
      <div class="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 class="text-white font-semibold">${variant.product_name} — ${variant.name}</h3>
          ${variant.sku ? `<span class="text-[11px] font-mono text-mint/40">SKU: ${variant.sku.toUpperCase()}</span>` : ''}
        </div>
        ${stokText}
      </div>

      <!-- INFO CENTRAL STOCK -->
      <div class="border border-jadebright/20 bg-jadebright/[0.04] rounded-xl p-4 mb-4">
        <div class="flex items-start gap-3">
          <i data-lucide="layers" class="w-5 text-jadebright shrink-0 mt-0.5"></i>
          <div>
            <p class="text-sm text-white font-medium mb-1">Stok Terpusat via Central Stock</p>
            <p class="text-xs text-mint/60 leading-relaxed">
              Stok dikelola di Central Panel. Stok tampilan di toko web real-time dari Central.
              ${noSku
                ? `<br><span class="text-amber-300">⚠️ Variasi ini belum punya SKU. Edit produk dan masukkan SKU yang terdaftar di Central.</span>`
                : centralStock
                  ? `<br>📦 Terjual: ${centralStock.stok_terjual} · SKU: ${variant.sku.toUpperCase()}`
                  : `<br>⚠️ Tidak bisa terhubung ke Central. Cek konfigurasi di menu <strong>Central Stock</strong>.`
              }
            </p>
          </div>
        </div>
      </div>

      <!-- LINK KE CENTRAL PANEL -->
      <a href="#" id="centralPanelLink" target="_blank" class="flex items-center gap-2 bg-jadebright text-ink font-semibold rounded-xl px-4 py-2.5 text-sm hover:brightness-110 transition w-fit mb-4">
        <i data-lucide="external-link" class="w-4"></i> Kelola Stok di Panel Central
      </a>

      <!-- SNK EDITOR (TETAP ADA) -->
      <div class="border border-mint/10 rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-semibold text-white flex items-center gap-2"><i data-lucide="file-text" class="w-4 text-jadebright"></i> Edit SNK (Syarat & Ketentuan)</label>
          <button id="snkToggleBtn" class="glass border border-mint/10 rounded-lg px-3 py-1.5 text-xs hover:border-jadebright/40 transition"><i data-lucide="pencil" class="w-3.5 inline"></i> Edit</button>
        </div>
        <div id="snkDisplay" class="text-xs text-mint/60 whitespace-pre-wrap">${(variant.snk || 'Belum ada SNK.').replace(/</g,'&lt;')}</div>
        <div id="snkEditor" class="hidden mt-2">
          <textarea id="snkInput" rows="3" class="w-full bg-ink/60 border border-mint/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-jadebright">${(variant.snk || '').replace(/</g,'&lt;')}</textarea>
          <button id="snkSaveBtn" class="mt-2 bg-jadebright text-ink font-semibold rounded-xl px-4 py-2 text-sm hover:brightness-110 transition flex items-center gap-2"><i data-lucide="check" class="w-4"></i> Simpan SNK</button>
        </div>
      </div>
    </div>`;

  lucide.createIcons();

  // Set link Central Panel
  const cpLink = $("#centralPanelLink");
  if (cpLink) {
    // Coba ambil URL dari localStorage atau default
    try {
      const cache = JSON.parse(localStorage.getItem("nova_central_cache") || "{}");
      cpLink.href = (cache.central_api_url || "https://central-panel.vercel.app").replace(/\/api.*$/, "");
    } catch (e) {
      cpLink.href = "https://central-panel.vercel.app";
    }
  }

  // SNK toggle
  $("#snkToggleBtn").addEventListener("click", () => {
    $("#snkDisplay").classList.toggle("hidden");
    $("#snkEditor").classList.toggle("hidden");
  });
  $("#snkSaveBtn").addEventListener("click", async () => {
    const snk = $("#snkInput").value.trim();
    try {
      await api("save_snk", { variant_id: selectedVariant, snk });
      toast("SNK disimpan");
      $("#snkDisplay").textContent = snk || "Belum ada SNK.";
      $("#snkDisplay").classList.remove("hidden");
      $("#snkEditor").classList.add("hidden");
      await loadCatalog();
    } catch (e) { toast(e.message, false); }
  });
}

/* ===================== COUPONS ===================== */
async function loadCoupons() {
  try {
    const { coupons } = await api("list_coupons");
    $("#couponList").innerHTML = coupons.map(c => `<div class="glass border border-mint/10 rounded-xl p-3 flex items-center gap-3">
      <div class="flex-1"><b class="text-white">${c.code}</b><p class="text-xs text-mint/45">${c.type} · ${c.value}${c.type==='percent'?'%':' rupiah'} · ${c.active?'aktif':'nonaktif'}</p></div>
      <button class="del-coupon text-red-300 p-2 hover:bg-red-400/10 rounded-lg" data-id="${c.id}"><i data-lucide="trash" class="w-4"></i></button>
    </div>`).join("") || `<p class="text-sm text-mint/40">Belum ada kupon.</p>`;
    lucide.createIcons();
    $$(".del-coupon").forEach((b) => b.addEventListener("click", async () => { try { await api("delete_coupon", { id: b.dataset.id }); toast("Kupon dihapus"); loadCoupons(); } catch (e) { toast(e.message, false); } }));
  } catch (e) { toast(e.message, false); }
}
$("#saveCouponBtn").addEventListener("click", async () => {
  const coupon = { code: $("#cCode").value.trim(), type: $("#cType").value, value: Number($("#cValue").value||0), active: $("#cActive").checked };
  if (!coupon.code || !coupon.value) return toast("Kode & nilai wajib", false);
  try { await api("save_coupon", { coupon });
    toast("Kupon disimpan"); $("#cCode").value = ""; $("#cValue").value = ""; loadCoupons(); } catch (e) { toast(e.message, false); }
});

/* ===================== CONFIG ===================== */
async function loadConfig() {
  try { const { config } = await api("get_config");
    $("#pkProject").value = config.pakasir_project || ""; $("#pkMode").value = config.pakasir_mode || "sandbox";
    $("#pkWebhook").value = config.webhook_url || (location.origin + "/api/pakasir-webhook");
    $("#keyStatus").textContent = config.api_key_set ? `API key tersimpan (${config.api_key_preview})` : "API key belum diset";
    $("#pkTelegramToken").value = config.telegram_bot_token || "";
    $("#pkTelegramChatId").value = config.telegram_chat_id || "";
    $("#msApiKey").value = config.mailersend_api_key || "";
    $("#msSenderEmail").value = config.mailersend_sender_email || "";
  } catch(e){ toast(e.message, false); }
}
$("#saveConfigBtn").addEventListener("click", async () => {
  try { await api("save_config", {
    pakasir_project: $("#pkProject").value.trim(),
    pakasir_mode: $("#pkMode").value,
    webhook_url: $("#pkWebhook").value.trim(),
    pakasir_api_key: $("#pkApiKey").value.trim(),
    telegram_bot_token: $("#pkTelegramToken").value.trim(),
    telegram_chat_id: $("#pkTelegramChatId").value.trim(),
    mailersend_api_key: $("#msApiKey").value.trim(),
    mailersend_sender_email: $("#msSenderEmail").value.trim(),
  });
    $("#pkApiKey").value = ""; toast("Konfigurasi disimpan"); loadConfig();
  } catch(e){ toast(e.message, false); }
});
$("#testTelegramBtn").addEventListener("click", async () => {
  const token = $("#pkTelegramToken").value.trim();
  const chatId = $("#pkTelegramChatId").value.trim();
  if (!token || !chatId) return toast("Isi Bot Token & Chat ID dulu", false);
  const btn = $("#testTelegramBtn");
  btn.disabled = true; btn.innerHTML = `<i data-lucide="loader" class="w-4 animate-spin"></i> Mengirim...`; lucide.createIcons();
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: "✅ <b>Novaciy° — Test Notifikasi</b>\nBot Telegram berfungsi dengan baik!", parse_mode: "HTML" }),
    });
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error(d.description || "Gagal kirim");
    toast("Notifikasi test terkirim!");
  } catch (e) { toast("Gagal: " + (e.message || "Unknown"), false); }
  finally { btn.disabled = false; btn.innerHTML = `<i data-lucide="send" class="w-4"></i> Test Notifikasi`; lucide.createIcons(); }
});

/* ===================== CENTRAL STOCK CONFIG (BARU) ===================== */
async function loadCentralConfig() {
  try {
    const { config } = await api("get_config");
    $("#centralApiUrl").value = config.central_api_url || "https://central-panel.vercel.app";
    $("#centralApiKeyStatus").textContent = config.central_api_key_set
      ? `✅ API key tersimpan (${config.central_api_key_preview})`
      : "❌ API key belum diset";
    $("#centralTestSku").value = "";
    $("#centralTestResult").innerHTML = "";
  } catch(e) { toast(e.message, false); }
}

$("#saveCentralConfigBtn").addEventListener("click", async () => {
  const url = $("#centralApiUrl").value.trim().replace(/\/+$/, "");
  const key = $("#centralApiKey").value.trim();
  if (!url) return toast("URL Central wajib diisi", false);
  try {
    await api("save_central_config", { central_api_url: url, central_api_key: key || undefined });
    $("#centralApiKey").value = "";
    // Cache URL untuk link di stock manager
    localStorage.setItem("nova_central_cache", JSON.stringify({ central_api_url: url }));
    toast("Central config disimpan");
    loadCentralConfig();
  } catch(e) { toast(e.message, false); }
});

$("#testCentralBtn").addEventListener("click", async () => {
  const sku = $("#centralTestSku").value.trim().toUpperCase();
  if (!sku) return toast("Masukkan SKU untuk test", false);
  const btn = $("#testCentralBtn");
  btn.disabled = true; btn.innerHTML = `<i data-lucide="loader" class="w-4 animate-spin"></i> Testing...`; lucide.createIcons();
  try {
    const data = await api("test_central", { sku });
    const resultBox = $("#centralTestResult");
    if (data.ok) {
      resultBox.innerHTML = `
        <div class="border border-jadebright/30 bg-jadebright/10 rounded-xl p-4 text-sm">
          <p class="text-jadebright font-semibold flex items-center gap-2"><i data-lucide="check-circle" class="w-4"></i> Koneksi Berhasil!</p>
          <p class="text-mint/70 mt-2">SKU: <strong class="text-white">${data.sku}</strong></p>
          <p class="text-mint/70">Stok tersedia: <strong class="text-white">${data.stok_tersedia}</strong></p>
          <p class="text-mint/70">Stok terjual: <strong class="text-white">${data.stok_terjual}</strong></p>
        </div>`;
    } else {
      resultBox.innerHTML = `
        <div class="border border-red-400/30 bg-red-400/10 rounded-xl p-4 text-sm">
          <p class="text-red-300 font-semibold flex items-center gap-2"><i data-lucide="x-circle" class="w-4"></i> Gagal</p>
          <p class="text-mint/70 mt-2">${data.error || 'Tidak bisa terhubung ke Central. Cek URL & API key.'}</p>
        </div>`;
    }
    lucide.createIcons();
  } catch(e) {
    $("#centralTestResult").innerHTML = `
      <div class="border border-red-400/30 bg-red-400/10 rounded-xl p-4 text-sm">
        <p class="text-red-300 font-semibold flex items-center gap-2"><i data-lucide="x-circle" class="w-4"></i> Error</p>
        <p class="text-mint/70 mt-2">${e.message}</p>
      </div>`;
    lucide.createIcons();
  } finally {
    btn.disabled = false; btn.innerHTML = `<i data-lucide="plug" class="w-4"></i> Test Koneksi`; lucide.createIcons();
  }
});

/* ===================== STORE SETTINGS ===================== */
async function loadStoreConfig() {
  try {
    const r = await fetch("/api/store-config");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    $("#sName").value = d.name || "";
    $("#sTagline").value = d.tagline || "";
    $("#sHeroTitle").value = d.hero_title || "";
    $("#sHeroSub").value = d.hero_subtitle || "";
    $("#sFooter").value = d.footer_text || "";
    $("#sBantuanFaq").value = d.bantuan_faq || "";
    if (d.annon) {
      $("#sAnnonActive").checked = d.annon.active;
      $("#sAnnonBadge").value = d.annon.badge_text || "";
      $("#sAnnonText").value = d.annon.text || "";
    }
  } catch(e) { toast(e.message, false); }
}
$("#saveStoreBtn").addEventListener("click", async () => {
  const body = {
    store_name: $("#sName").value.trim(),
    store_tagline: $("#sTagline").value.trim(),
    store_hero_title: $("#sHeroTitle").value.trim(),
    store_hero_subtitle: $("#sHeroSub").value.trim(),
    store_footer_text: $("#sFooter").value.trim(),
  };
  try {
    const r = await fetch("/api/store-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, password: ADMIN_PASSWORD }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    toast("Pengaturan toko disimpan");
  } catch(e) { toast(e.message, false); }
});

/* ===================== FAQ ===================== */
$("#saveBantuanBtn").addEventListener("click", async () => {
  const body = { bantuan_faq: $("#sBantuanFaq").value.trim() };
  try {
    const r = await fetch("/api/store-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, password: ADMIN_PASSWORD }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    toast("FAQ disimpan");
  } catch(e) { toast(e.message, false); }
});

$("#saveAnnonBtn").addEventListener("click", async () => {
  const body = {
    annon_active: $("#sAnnonActive").checked,
    annon_badge_text: $("#sAnnonBadge").value.trim(),
    annon_text: $("#sAnnonText").value.trim(),
  };
  try {
    const r = await fetch("/api/store-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, password: ADMIN_PASSWORD }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    toast("Announcement disimpan");
  } catch(e) { toast(e.message, false); }
});

/* ===================== SOSIAL MEDIA ===================== */
async function loadSocConfig() {
  try {
    const r = await fetch("/api/store-config");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    const soc = d.soc || {};
    $("#sWaActive").checked = soc.wa_active;
    $("#sWaNumber").value = soc.wa_number || "";
    $("#sTeleActive").checked = soc.tele_active;
    $("#sTeleChannelActive").checked = soc.tele_channel_active;
    $("#sTeleChannel").value = soc.tele_channel || "";
    $("#sTeleBotActive").checked = soc.tele_bot_active;
    $("#sTeleBot").value = soc.tele_bot || "";
    $("#sXActive").checked = soc.x_active;
    $("#sXLink").value = soc.x_link || "";
    $("#sIgActive").checked = soc.ig_active;
    $("#sIgLink").value = soc.ig_link || "";
  } catch(e) { toast(e.message, false); }
}

$("#saveSocBtn").addEventListener("click", async () => {
  const body = {
    soc_wa_active: $("#sWaActive").checked,
    soc_wa_number: $("#sWaNumber").value.trim(),
    soc_tele_active: $("#sTeleActive").checked,
    soc_tele_channel_active: $("#sTeleChannelActive").checked,
    soc_tele_channel: $("#sTeleChannel").value.trim(),
    soc_tele_bot_active: $("#sTeleBotActive").checked,
    soc_tele_bot: $("#sTeleBot").value.trim(),
    soc_x_active: $("#sXActive").checked,
    soc_x_link: $("#sXLink").value.trim(),
    soc_ig_active: $("#sIgActive").checked,
    soc_ig_link: $("#sIgLink").value.trim(),
  };
  try {
    const r = await fetch("/api/store-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, password: ADMIN_PASSWORD }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    toast("Sosial media disimpan");
  } catch(e) { toast(e.message, false); }
});

/* ===================== INIT ===================== */
$("#refreshBtn").addEventListener("click", async () => { await loadCatalog({ refreshInsights: true }); toast("Data dashboard disinkronkan"); });

function applyAdminBrand() {
  try {
    var c = JSON.parse(localStorage.getItem("nova_store_cache"));
    if (!c || !c.name) return;
    var prefix = c.name.slice(0, 4);
    var suffix = c.name.slice(4).replace(/[°^]/g, '');
    var dot = c.name.includes('°') ? '°' : c.name.includes('^') ? '^' : '';
    var html = suffix && dot
      ? prefix + '<em class="italic">' + suffix + '</em><sup class="text-jadebright">' + dot + '</sup>'
      : c.name;
    document.title = c.name + " — Admin";
    var els = document.querySelectorAll('#sidebar .font-serif, #gateBrand');
    for (var i = 0; i < els.length; i++) els[i].innerHTML = html;
  } catch(e){}
}

function startAutoSync() {
  if (window.__novaAdminSync) clearInterval(window.__novaAdminSync);
  window.__novaAdminSync = setInterval(() => loadCatalog({ refreshInsights: true }), 30000);
}
function boot() {
  applyAdminBrand();
  loadCatalog({ refreshInsights: true });
  startAutoSync();
  fetch("/api/store-config?t=" + Date.now()).then(function(r){return r.json();}).then(function(d){
    if (d && d.name) {
      localStorage.setItem("nova_store_cache", JSON.stringify(d));
      applyAdminBrand();
    }
  }).catch(function(){});
}
lucide.createIcons();
