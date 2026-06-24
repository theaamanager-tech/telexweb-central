"use client"

import { useState } from "react"
import Sidebar from "./sidebar"
import { MobileSidebar } from "./mobile-sidebar"

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-800 flex items-center gap-3 px-4 bg-black/50 backdrop-blur-sm sticky top-0 z-30">
          <MobileSidebar />
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Online</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
