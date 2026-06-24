"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Package, History, Key, LayoutDashboard, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produk", label: "Produk", icon: Package },
  { href: "/riwayat", label: "Riwayat Claim", icon: History },
  { href: "/settings/api-keys", label: "API Keys", icon: Key },
]

function NavLinks({ collapsed }: { collapsed?: boolean }) {
  const pathname = usePathname()

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
              collapsed && "justify-center px-0",
              isActive
                ? "bg-[#FF2800]/10 text-[#FF2800] font-medium"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        )
      })}
    </>
  )
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-zinc-400 hover:bg-zinc-800 cursor-pointer">
        <Menu className="w-5 h-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-black border-zinc-800 p-0">
        <div className="flex items-center h-16 px-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF2800] flex items-center justify-center text-white font-bold text-sm">T</div>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-sm leading-tight">TelexWeb</span>
              <span className="text-zinc-500 text-[10px] leading-tight">Central Stock</span>
            </div>
          </div>
        </div>
        <nav className="py-4 px-2 space-y-1">
          <NavLinks />
        </nav>
      </SheetContent>
    </Sheet>
  )
}
