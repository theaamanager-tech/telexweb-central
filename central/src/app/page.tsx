"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Package, AlertTriangle, TrendingUp, Database, Search } from "lucide-react"
import Link from "next/link"

interface StockSummary {
  sku: string
  product_name: string
  variant_name: string
  stok_tersedia: number
  stok_terjual: number
  total_stok: number
}

export default function Dashboard() {
  const [data, setData] = useState<StockSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: result } = await supabase
        .from("stock_summary")
        .select("*")
        .order("product_name")
        .order("variant_name")

      if (result) setData(result)
    } catch (e) {
      console.error("Gagal load data:", e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = data.filter(
    (item) =>
      item.product_name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  )

  const totalStok = data.reduce((a, b) => a + b.stok_tersedia, 0)
  const totalProduk = data.length
  const todaySold = data.reduce((a, b) => a + b.stok_terjual, 0)
  const lowStock = data.filter((d) => d.stok_tersedia > 0 && d.stok_tersedia <= 5).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Ringkasan stok semua produk</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalStok.toLocaleString()}</p>
              <p className="text-xs text-zinc-500">Total Stok</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalProduk}</p>
              <p className="text-xs text-zinc-500">Varian Produk</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF2800]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#FF2800]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{todaySold}</p>
              <p className="text-xs text-zinc-500">Total Terjual</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{lowStock}</p>
              <p className="text-xs text-zinc-500">Stok Menipis</p>
            </div>
          </div>
        </Card>
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

      {/* Tabel Produk */}
      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-500 font-medium">SKU</TableHead>
              <TableHead className="text-zinc-500 font-medium">Produk</TableHead>
              <TableHead className="text-zinc-500 font-medium">Varian</TableHead>
              <TableHead className="text-zinc-500 font-medium text-right">Stok</TableHead>
              <TableHead className="text-zinc-500 font-medium text-right">Terjual</TableHead>
              <TableHead className="text-zinc-500 font-medium text-center">Status</TableHead>
              <TableHead className="text-zinc-500 font-medium text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-zinc-500 py-12">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-zinc-500 py-12">
                  {search ? "Produk tidak ditemukan" : "Belum ada produk. Tambah produk dulu di menu Produk."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.sku} className="border-zinc-800 hover:bg-zinc-800/30">
                  <TableCell>
                    <code className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300 font-mono">
                      {item.sku}
                    </code>
                  </TableCell>
                  <TableCell className="text-white font-medium">{item.product_name}</TableCell>
                  <TableCell className="text-zinc-400">{item.variant_name}</TableCell>
                  <TableCell className="text-right text-white font-mono">{item.stok_tersedia}</TableCell>
                  <TableCell className="text-right text-zinc-400 font-mono">{item.stok_terjual}</TableCell>
                  <TableCell className="text-center">
                    {item.stok_tersedia === 0 ? (
                      <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">
                        Habis
                      </Badge>
                    ) : item.stok_tersedia <= 5 ? (
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                        Menipis
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        {item.stok_tersedia}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/produk/${item.sku}`}
                      className="text-xs text-zinc-400 hover:text-[#FF2800] transition-colors"
                    >
                      Lihat →
                    </Link>
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
