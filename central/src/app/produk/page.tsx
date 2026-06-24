"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, Upload, Package, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

interface MasterProduct {
  id: string
  name: string
  cat: string
  sort_order: number
}

interface MasterVariant {
  id: string
  product_id: string
  sku: string
  name: string
  sort_order: number
}

interface StockSummary {
  sku: string
  product_name: string
  variant_name: string
  stok_tersedia: number
  stok_terjual: number
  total_stok: number
}

export default function ProdukPage() {
  const [products, setProducts] = useState<MasterProduct[]>([])
  const [variants, setVariants] = useState<MasterVariant[]>([])
  const [stockMap, setStockMap] = useState<Record<string, StockSummary>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Dialog states
  const [openProduct, setOpenProduct] = useState(false)
  const [openVariant, setOpenVariant] = useState(false)
  const [openBulk, setOpenBulk] = useState(false)
  const [openEditProduct, setOpenEditProduct] = useState(false)
  const [openEditVariant, setOpenEditVariant] = useState(false)

  // Form states
  const [prodName, setProdName] = useState("")
  const [prodCat, setProdCat] = useState("ai")
  const [varProductId, setVarProductId] = useState("")
  const [varName, setVarName] = useState("")
  const [varSku, setVarSku] = useState("")
  const [bulkSku, setBulkSku] = useState("")
  const [bulkData, setBulkData] = useState("")

  // Edit states
  const [editProduct, setEditProduct] = useState<MasterProduct | null>(null)
  const [editVariant, setEditVariant] = useState<MasterVariant | null>(null)
  const [editProdName, setEditProdName] = useState("")
  const [editProdCat, setEditProdCat] = useState("ai")
  const [editVarProductId, setEditVarProductId] = useState("")
  const [editVarName, setEditVarName] = useState("")
  const [editVarSku, setEditVarSku] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [pResult, vResult, sResult] = await Promise.all([
        supabase.from("master_products").select("*").order("sort_order"),
        supabase.from("master_variants").select("*").order("sort_order"),
        supabase.from("stock_summary").select("*"),
      ])
      if (pResult.data) setProducts(pResult.data)
      if (vResult.data) setVariants(vResult.data)
      if (sResult.data) {
        const map: Record<string, StockSummary> = {}
        sResult.data.forEach((item) => (map[item.sku] = item))
        setStockMap(map)
      }
    } catch (e) {
      console.error("Gagal load:", e)
    } finally {
      setLoading(false)
    }
  }

  async function addProduct() {
    if (!prodName) return
    await supabase.from("master_products").insert({ name: prodName, cat: prodCat })
    setProdName("")
    setOpenProduct(false)
    loadData()
  }

  async function addVariant() {
    if (!varName || !varSku || !varProductId) return
    await supabase.from("master_variants").insert({
      product_id: varProductId,
      sku: varSku.toUpperCase(),
      name: varName,
    })
    setVarName("")
    setVarSku("")
    setOpenVariant(false)
    loadData()
  }

  async function updateProduct() {
    if (!editProduct || !editProdName) return
    await supabase.from("master_products").update({ name: editProdName, cat: editProdCat }).eq("id", editProduct.id)
    setOpenEditProduct(false)
    setEditProduct(null)
    loadData()
  }

  async function deleteProduct(id: string) {
    if (!confirm("Hapus produk ini? Semua varian di dalamnya juga akan terhapus.")) return
    await supabase.from("master_products").delete().eq("id", id)
    loadData()
  }

  async function updateVariant() {
    if (!editVariant || !editVarName || !editVarSku) return
    await supabase.from("master_variants").update({
      product_id: editVarProductId,
      sku: editVarSku.toUpperCase(),
      name: editVarName,
    }).eq("id", editVariant.id)
    setOpenEditVariant(false)
    setEditVariant(null)
    loadData()
  }

  async function deleteVariant(id: string) {
    if (!confirm("Hapus varian ini?")) return
    await supabase.from("master_variants").delete().eq("id", id)
    loadData()
  }

  function openEditProductDialog(p: MasterProduct) {
    setEditProduct(p)
    setEditProdName(p.name)
    setEditProdCat(p.cat)
    setOpenEditProduct(true)
  }

  function openEditVariantDialog(v: MasterVariant) {
    setEditVariant(v)
    setEditVarProductId(v.product_id)
    setEditVarName(v.name)
    setEditVarSku(v.sku)
    setOpenEditVariant(true)
  }

  async function addBulkStock() {
    if (!bulkSku || !bulkData.trim()) return
    const lines = bulkData.trim().split("\n").filter(Boolean)
    const credentials = lines.map((l) => ({ sku: bulkSku.toUpperCase(), credential: l.trim() }))

    await supabase.from("stock_items").insert(credentials)
    setBulkData("")
    setOpenBulk(false)
    loadData()
  }

  // Group variants by product
  const grouped = products.map((p) => ({
    ...p,
    variants: variants.filter((v) => v.product_id === p.id),
  }))

  const filtered = grouped.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.variants.some((v) => v.sku.toLowerCase().includes(search.toLowerCase()) || v.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Produk</h1>
          <p className="text-zinc-500 text-sm mt-1">Kelola produk, varian, dan stok</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openProduct} onOpenChange={setOpenProduct}>
            <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm cursor-pointer">
              <Plus className="w-4 h-4" />
              Produk
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle>Tambah Produk Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Nama produk (contoh: CapCut Pro)"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Select value={prodCat} onValueChange={(v) => v && setProdCat(v)}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectItem value="ai">AI Tools</SelectItem>
                    <SelectItem value="editing">Editing</SelectItem>
                    <SelectItem value="account">Akun</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addProduct} className="w-full bg-[#FF2800] hover:bg-[#FF2800]/80 text-white">
                  Simpan
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openVariant} onOpenChange={setOpenVariant}>
            <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF2800] hover:bg-[#FF2800]/80 text-white text-sm font-medium cursor-pointer">
              <Plus className="w-4 h-4" />
              Varian
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle>Tambah Varian Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Select value={varProductId} onValueChange={(v) => v && setVarProductId(v)}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="SKU (contoh: CC-7D)"
                  value={varSku}
                  onChange={(e) => setVarSku(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white font-mono uppercase"
                />
                <Input
                  placeholder="Nama varian (contoh: 7 Hari)"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Button onClick={addVariant} className="w-full bg-[#FF2800] hover:bg-[#FF2800]/80 text-white">
                  Simpan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Cari produk atau SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600"
        />
      </div>

      {loading ? (
        <div className="text-center text-zinc-500 py-12">Memuat data...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-zinc-500 py-12">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada produk. Klik "Produk" untuk menambah.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((product) => (
            <Card key={product.id} className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-zinc-500" />
                <h3 className="text-white font-semibold">{product.name}</h3>
                <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 ml-2 text-[10px]">
                  {product.cat}
                </Badge>
                <div className="ml-auto flex gap-1">
                  <button
                    onClick={() => openEditProductDialog(product)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="Edit produk"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    title="Hapus produk"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-500">SKU</TableHead>
                    <TableHead className="text-zinc-500">Varian</TableHead>
                    <TableHead className="text-zinc-500 text-right">Stok</TableHead>
                    <TableHead className="text-zinc-500 text-right">Terjual</TableHead>
                    <TableHead className="text-zinc-500 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.variants.map((v) => {
                    const s = stockMap[v.sku]
                    return (
                      <TableRow key={v.id} className="border-zinc-800 hover:bg-zinc-800/30">
                        <TableCell>
                          <code className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300 font-mono">
                            {v.sku}
                          </code>
                        </TableCell>
                        <TableCell className="text-zinc-300">{v.name}</TableCell>
                        <TableCell className="text-right font-mono">
                          <span className={s && s.stok_tersedia <= 5 ? "text-amber-500" : "text-white"}>
                            {s?.stok_tersedia ?? 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-zinc-500">
                          {s?.stok_terjual ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Link
                              href={`/produk/${v.sku}`}
                              className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                            >
                              Detail
                            </Link>
                            <button
                              onClick={() => openEditVariantDialog(v)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="Edit varian"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteVariant(v.id)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                              title="Hapus varian"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={openEditProduct} onOpenChange={setOpenEditProduct}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Nama produk"
              value={editProdName}
              onChange={(e) => setEditProdName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            <Select value={editProdCat} onValueChange={(v) => v && setEditProdCat(v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                <SelectItem value="ai">AI Tools</SelectItem>
                <SelectItem value="editing">Editing</SelectItem>
                <SelectItem value="account">Akun</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={updateProduct} className="w-full bg-[#FF2800] hover:bg-[#FF2800]/80 text-white">
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Variant Dialog */}
      <Dialog open={openEditVariant} onOpenChange={setOpenEditVariant}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit Varian</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={editVarProductId} onValueChange={(v) => v && setEditVarProductId(v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Pilih produk" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="SKU (contoh: CC-7D)"
              value={editVarSku}
              onChange={(e) => setEditVarSku(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white font-mono uppercase"
            />
            <Input
              placeholder="Nama varian (contoh: 7 Hari)"
              value={editVarName}
              onChange={(e) => setEditVarName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            <Button onClick={updateVariant} className="w-full bg-[#FF2800] hover:bg-[#FF2800]/80 text-white">
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={openBulk} onOpenChange={setOpenBulk}>
        <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm font-medium fixed bottom-6 right-6 shadow-lg cursor-pointer">
          <Upload className="w-4 h-4" />
          Bulk Add
        </DialogTrigger>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Stok (Bulk)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={bulkSku} onValueChange={(v) => v && setBulkSku(v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Pilih SKU" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                {variants.map((v) => (
                  <SelectItem key={v.id} value={v.sku}>
                    {v.sku} — {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <p className="text-xs text-zinc-500 mb-2">Format: 1 baris = 1 credential</p>
              <textarea
                placeholder={`email1@mail.com|password1\nemail2@mail.com|password2`}
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm font-mono placeholder:text-zinc-600 resize-none"
              />
            </div>
            <Button
              onClick={addBulkStock}
              className="w-full bg-[#FF2800] hover:bg-[#FF2800]/80 text-white"
              disabled={!bulkSku || !bulkData.trim()}
            >
              Tambah {bulkData.trim().split("\n").filter(Boolean).length} Baris
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
