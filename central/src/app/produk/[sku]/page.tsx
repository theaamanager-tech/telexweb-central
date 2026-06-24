"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Search, Plus, Upload, Trash2, CheckCircle, XCircle, ClipboardCopy } from "lucide-react"
import Link from "next/link"

interface StockItem {
  id: string
  sku: string
  credential: string
  status: string
  claimed_by: string | null
  order_ref: string | null
  created_at: string
  sold_at: string | null
}

interface VariantInfo {
  sku: string
  name: string
  product_name: string
}

export default function DetailProduk() {
  const params = useParams()
  const sku = params.sku as string

  const [variant, setVariant] = useState<VariantInfo | null>(null)
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [openAdd, setOpenAdd] = useState(false)
  const [openBulk, setOpenBulk] = useState(false)
  const [newCredential, setNewCredential] = useState("")
  const [bulkData, setBulkData] = useState("")

  useEffect(() => {
    loadData()
  }, [sku])

  async function loadData() {
    setLoading(true)
    try {
      // Get variant info via stock_summary view
      const { data: summary } = await supabase
        .from("stock_summary")
        .select("*")
        .eq("sku", sku.toUpperCase())
        .single()

      if (summary) {
        setVariant({
          sku: summary.sku,
          name: summary.variant_name,
          product_name: summary.product_name,
        })
      }

      // Get all stock items
      const { data: stockData } = await supabase
        .from("stock_items")
        .select("*")
        .eq("sku", sku.toUpperCase())
        .order("created_at", { ascending: false })

      if (stockData) setItems(stockData)
    } catch (e) {
      console.error("Error:", e)
    } finally {
      setLoading(false)
    }
  }

  async function addSingle() {
    if (!newCredential.trim()) return
    await supabase.from("stock_items").insert({
      sku: sku.toUpperCase(),
      credential: newCredential.trim(),
    })
    setNewCredential("")
    setOpenAdd(false)
    loadData()
  }

  async function addBulk() {
    if (!bulkData.trim()) return
    const lines = bulkData.trim().split("\n").filter(Boolean)
    const credentials = lines.map((l) => ({
      sku: sku.toUpperCase(),
      credential: l.trim(),
    }))
    await supabase.from("stock_items").insert(credentials)
    setBulkData("")
    setOpenBulk(false)
    loadData()
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    await supabase.from("stock_items").delete().in("id", ids)
    setSelectedIds(new Set())
    loadData()
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const filtered = items.filter(
    (item) =>
      item.credential.toLowerCase().includes(search.toLowerCase()) ||
      item.order_ref?.toLowerCase().includes(search.toLowerCase())
  )

  const available = items.filter((i) => i.status === "available").length
  const sold = items.filter((i) => i.status === "sold").length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/produk"
          className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">
              {variant?.product_name || "Detail Produk"}
            </h1>
            <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 font-mono">{sku}</Badge>
          </div>
          <p className="text-zinc-500 text-sm mt-1">
            {variant?.name || "Memuat..."}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800 p-4">
          <p className="text-2xl font-bold text-emerald-500">{available}</p>
          <p className="text-xs text-zinc-500">Stok Tersedia</p>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-4">
          <p className="text-2xl font-bold text-[#FF2800]">{sold}</p>
          <p className="text-xs text-zinc-500">Terjual</p>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-4">
          <p className="text-2xl font-bold text-white">{items.length}</p>
          <p className="text-xs text-zinc-500">Total</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FF2800] hover:bg-[#FF2800]/80 text-white text-sm font-medium cursor-pointer">
              <Plus className="w-4 h-4" />
              Tambah
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle>Tambah 1 Credential</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="email@mail.com|password"
                  value={newCredential}
                  onChange={(e) => setNewCredential(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white font-mono"
                />
                <Button onClick={addSingle} className="w-full bg-[#FF2800] hover:bg-[#FF2800]/80 text-white">
                  Simpan
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openBulk} onOpenChange={setOpenBulk}>
            <DialogTrigger className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm cursor-pointer">
              <Upload className="w-4 h-4" />
              Bulk
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
              <DialogHeader>
                <DialogTitle>Tambah Stok Bulk — {sku}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <p className="text-xs text-zinc-500">1 baris = 1 credential</p>
                <textarea
                  placeholder={`email1@mail.com|password1\nemail2@mail.com|password2`}
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm font-mono placeholder:text-zinc-600 resize-none"
                />
                <Button
                  onClick={addBulk}
                  className="w-full bg-[#FF2800] hover:bg-[#FF2800]/80 text-white"
                  disabled={!bulkData.trim()}
                >
                  Tambah {bulkData.trim().split("\n").filter(Boolean).length} Baris
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {selectedIds.size > 0 && (
            <Button size="sm" variant="destructive" onClick={deleteSelected}>
              <Trash2 className="w-4 h-4 mr-1" />
              Hapus {selectedIds.size}
            </Button>
          )}
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Cari credential..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 h-9 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-8"></TableHead>
              <TableHead className="text-zinc-500 font-medium">#</TableHead>
              <TableHead className="text-zinc-500 font-medium">Credential</TableHead>
              <TableHead className="text-zinc-500 font-medium">Status</TableHead>
              <TableHead className="text-zinc-500 font-medium">Order Ref</TableHead>
              <TableHead className="text-zinc-500 font-medium text-right">Tanggal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 py-12">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 py-12">
                  {search ? "Credential tidak ditemukan" : "Belum ada stok. Tambah stok untuk memulai."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item, idx) => (
                <TableRow
                  key={item.id}
                  className={`border-zinc-800 hover:bg-zinc-800/30 ${selectedIds.has(item.id) ? "bg-zinc-800/50" : ""}`}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-zinc-600 bg-zinc-800"
                      disabled={item.status === "sold"}
                    />
                  </TableCell>
                  <TableCell className="text-zinc-500 text-xs font-mono">{idx + 1}</TableCell>
                  <TableCell className="font-mono text-xs text-zinc-300 max-w-xs truncate">
                    {item.credential}
                  </TableCell>
                  <TableCell>
                    {item.status === "available" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Tersedia
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px]">
                        <XCircle className="w-3 h-3 mr-1" />
                        Terjual
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 font-mono">
                    {item.order_ref || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 text-right">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
