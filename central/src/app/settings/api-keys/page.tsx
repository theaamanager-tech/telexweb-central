"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Key, Plus, Copy, Check } from "lucide-react"

interface ApiKey {
  id: string
  key: string
  store_name: string
  store_type: string
  active: boolean
  created_at: string
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [storeName, setStoreName] = useState("")
  const [storeType, setStoreType] = useState("telegram")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadKeys()
  }, [])

  async function loadKeys() {
    try {
      const { data } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false })

      if (data) setKeys(data)
    } catch (e) {
      console.error("Error:", e)
    } finally {
      setLoading(false)
    }
  }

  async function generateKey() {
    if (!storeName) return

    const key = "tcentral_" + Array.from({ length: 32 }, () =>
      "abcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(Math.random() * 36))
    ).join("")

    await supabase.from("api_keys").insert({
      key,
      store_name: storeName,
      store_type: storeType,
    })

    setStoreName("")
    setOpen(false)
    loadKeys()
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("api_keys").update({ active: !current }).eq("id", id)
    loadKeys()
  }

  async function deleteKey(id: string) {
    await supabase.from("api_keys").delete().eq("id", id)
    loadKeys()
  }

  function copyKey(key: string, id: string) {
    navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="text-zinc-500 text-sm mt-1">Kelola akses toko ke Central Stock</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF2800] hover:bg-[#FF2800]/80 text-white text-sm font-medium cursor-pointer">
            <Plus className="w-4 h-4" />
            Tambah Toko
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>Tambah API Key Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Nama toko (contoh: Toko WhatsApp)"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <Select value={storeType} onValueChange={(v) => v && setStoreType(v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Tipe toko" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectItem value="telegram">Telegram Bot</SelectItem>
                  <SelectItem value="web">Website</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={generateKey}
                className="w-full bg-[#FF2800] hover:bg-[#FF2800]/80 text-white"
                disabled={!storeName}
              >
                Generate Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-500 font-medium">Toko</TableHead>
              <TableHead className="text-zinc-500 font-medium">Tipe</TableHead>
              <TableHead className="text-zinc-500 font-medium">API Key</TableHead>
              <TableHead className="text-zinc-500 font-medium text-center">Status</TableHead>
              <TableHead className="text-zinc-500 font-medium text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-500 py-12">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-500 py-12">
                  <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Belum ada API Key. Tambah toko untuk memulai.</p>
                </TableCell>
              </TableRow>
            ) : (
              keys.map((item) => (
                <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-800/30">
                  <TableCell className="text-white font-medium">{item.store_name}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.store_type === "telegram"
                          ? "bg-sky-500/10 text-sky-500 border-sky-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      }
                    >
                      {item.store_type === "telegram" ? "Telegram" : "Website"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300 font-mono">
                        {item.key.slice(0, 20)}...
                      </code>
                      <button
                        onClick={() => copyKey(item.key, item.id)}
                        className="text-zinc-500 hover:text-white transition-colors"
                        title="Copy key"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => toggleActive(item.id, item.active)}
                      className={`text-xs px-2 py-1 rounded-full transition-colors ${
                        item.active
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-500 border border-red-500/20"
                      }`}
                    >
                      {item.active ? "Active" : "Inactive"}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteKey(item.id)}
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      Hapus
                    </Button>
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
