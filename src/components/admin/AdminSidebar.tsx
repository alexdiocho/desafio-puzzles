"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"

const navItems = [
  { href: "", label: "Dashboard", icon: "◈" },
  { href: "/fases", label: "Fases", icon: "▣" },
  { href: "/desafios", label: "Desafíos", icon: "◉" },
  { href: "/equipos", label: "Equipos", icon: "◎" },
  { href: "/config", label: "Configuración", icon: "⚙" },
]

export default function AdminSidebar() {
  const [open, setOpen] = useState(false)
  const params = useParams()
  const pathname = usePathname()
  const secret = params.secret as string
  const base = `/admin/${secret}`

  const SidebarContent = () => (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border-subtle)",
        width: "14rem",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div
          className="font-mono font-bold text-xs tracking-widest uppercase px-2 py-1.5 rounded text-center"
          style={{
            background: "rgba(255,215,0,0.1)",
            color: "var(--accent-gold)",
            border: "1px solid rgba(255,215,0,0.25)",
            textShadow: "0 0 8px rgba(255,215,0,0.4)",
          }}
        >
          ⬡ MODO ADMIN
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const href = `${base}${item.href}`
          const isActive =
            item.href === ""
              ? pathname === base
              : pathname.startsWith(`${base}${item.href}`)
          return (
            <Link
              key={item.href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all duration-150"
              style={
                isActive
                  ? {
                      background: "rgba(255,215,0,0.12)",
                      color: "var(--accent-gold)",
                      boxShadow: "inset 0 0 8px rgba(255,215,0,0.1)",
                    }
                  : { color: "var(--text-secondary)" }
              }
            >
              <span className="font-mono text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <Link
          href="/"
          className="font-mono text-xs flex items-center gap-1.5 transition-colors hover:opacity-80"
          style={{ color: "var(--text-muted)" }}
        >
          ← Vista pública
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sticky sidebar */}
      <div
        className="hidden md:block flex-shrink-0"
        style={{
          width: "14rem",
          position: "sticky",
          top: "3.5rem",
          height: "calc(100vh - 3.5rem)",
          alignSelf: "flex-start",
        }}
      >
        <SidebarContent />
      </div>

      {/* Mobile: hamburger button */}
      <button
        className="md:hidden fixed bottom-5 left-4 z-50 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
        style={{
          background: "var(--accent-gold)",
          color: "#000",
          boxShadow: "0 0 20px rgba(255,215,0,0.4)",
        }}
        onClick={() => setOpen(!open)}
        aria-label="Toggle admin menu"
      >
        {open ? "×" : "≡"}
      </button>

      {/* Mobile: backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile: drawer */}
      <div
        className="md:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-200"
        style={{
          width: "14rem",
          transform: open ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <SidebarContent />
      </div>
    </>
  )
}
