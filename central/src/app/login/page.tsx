"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleLogin() {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      window.location.href = "/"
    } else {
      setError("Password salah")
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <Card className="w-full max-w-sm bg-zinc-900/50 border-zinc-800 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#FF2800] flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
            T
          </div>
          <h1 className="text-xl font-bold text-white">TelexWeb Central</h1>
          <p className="text-zinc-500 text-sm mt-1">Masukkan password untuk melanjutkan</p>
        </div>
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError("") }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            onClick={handleLogin}
            className="w-full bg-[#FF2800] hover:bg-[#FF2800]/80 text-white"
          >
            Masuk
          </Button>
        </div>
      </Card>
    </div>
  )
}
