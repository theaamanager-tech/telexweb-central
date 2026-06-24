"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Search, History } from "lucide-react"

interface ClaimLog {
  id: string
  sku: string
  credential: string
  store_name: string
  store_type: string
  order_ref: string
  claimed_at: string
}

export default function RiwayatPage() {
  const [logs, setLogs] = useState<ClaimLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStore, setFilterStore] = useState("all")
  const [page, setPage] = useState(0)
  const perPage = 50

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    try {
      const { data } = await supabase
        .from("claim_logs")
        .select("*")
        .order("claimed_at", { ascending: false })

      if (data) setLogs(data)
    } catch (e) {
      console.error("Error loading logs:", e)
    } finally {
      setLoading(false)
    }
  }

  const stores = [...new Set(logs.map((l) => l.store_name))]

  const filtered = logs.filter((log) => {
    const matchSearch =
      log.sku.toLowerCase().includes(search.toLowerCase()) ||
      log.credential.toLowerCase().includes(search.toLowerCase()) ||
      log.store_name.toLowerCase().includes(search.toLowerCase()) ||
      log.order_ref.toLowerCase().includes(search.toLowerCase())

    const matchStore = filterStore === "all" || log.store_name === filterStore

    return matchSearch && matchStore
  })

  const paginated = filtered.slice(page * perPage, (page + 1) * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Riwayat Claim</h1>
        <p className="text-zinc-500 text-sm mt-1">Log semua pengambilan stok oleh toko</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Cari SKU, credential, toko..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600"
          />
        </div>
        <Select value={filterStore} onValueChange={(v) => v && setFilterStore(v)}>
          <SelectTrigger className="w-40 bg-zinc-900/50 border-zinc-800 text-white">
            <SelectValue placeholder="Semua Toko" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
            <SelectItem value="all">Semua Toko</SelectItem>
            {stores.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-500 font-medium">Waktu</TableHead>
              <TableHead className="text-zinc-500 font-medium">Toko</TableHead>
              <TableHead className="text-zinc-500 font-medium">SKU</TableHead>
              <TableHead className="text-zinc-500 font-medium">Credential</TableHead>
              <TableHead className="text-zinc-500 font-medium">Order Ref</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-500 py-12">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-500 py-12">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Belum ada riwayat claim.</p>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((log) => (
                <TableRow key={log.id} className="border-zinc-800 hover:bg-zinc-800/30">
                  <TableCell className="text-zinc-300 text-sm whitespace-nowrap">
                    {new Date(log.claimed_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        log.store_type === "telegram"
                          ? "bg-sky-500/10 text-sky-500 border-sky-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      }
                    >
                      {log.store_name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300 font-mono">
                      {log.sku}
                    </code>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-400 max-w-xs truncate">
                    {log.credential}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 font-mono">
                    {log.order_ref || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm rounded-lg bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-zinc-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm rounded-lg bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
