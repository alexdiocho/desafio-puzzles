"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

export default function ConfigPage() {
  const params = useParams()
  const secret = params.secret as string

  const [visible, setVisible] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const h = { "x-admin-secret": secret }
  const hJson = { ...h, "Content-Type": "application/json" }

  useEffect(() => {
    fetch("/api/admin/config/ranking", { headers: h })
      .then((r) => r.json())
      .then((data) => setVisible(data.visible ?? false))
      .finally(() => setLoading(false))
  }, [secret])

  async function toggle() {
    if (visible === null) return
    const next = !visible
    setSaving(true)
    try {
      const res = await fetch("/api/admin/config/ranking", {
        method: "PUT",
        headers: hJson,
        body: JSON.stringify({ visible: next }),
      })
      if (!res.ok) throw new Error()
      setVisible(next)
      showToast(next ? "Ranking visible para los equipos" : "Ranking oculto para los equipos")
    } catch {
      showToast("Error al guardar configuración", false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <header className="mb-8">
        <h1
          className="font-grotesk font-bold text-2xl"
          style={{ color: "var(--accent-gold)", textShadow: "0 0 12px rgba(255,215,0,0.3)" }}
        >
          Configuración
        </h1>
        <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Ajustes globales del desafío
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>CARGANDO...</p>
        </div>
      ) : (
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="font-grotesk font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>
                Visibilidad del ranking
              </h2>
              <p className="font-mono text-sm" style={{ color: "var(--text-secondary)" }}>
                Controla si los equipos pueden ver el ranking público.
                <br />
                Útil para generar tensión antes de revelar resultados.
              </p>

              {/* Status indicator */}
              <div
                className="inline-flex items-center gap-2 mt-4 px-3 py-2 rounded-lg font-mono text-sm font-bold"
                style={
                  visible
                    ? {
                        background: "rgba(0,255,136,0.1)",
                        color: "var(--accent-green)",
                        border: "1px solid rgba(0,255,136,0.25)",
                      }
                    : {
                        background: "rgba(255,51,85,0.1)",
                        color: "var(--accent-red)",
                        border: "1px solid rgba(255,51,85,0.25)",
                      }
                }
              >
                <span className={visible ? "animate-glow-pulse" : ""}>
                  {visible ? "◉" : "○"}
                </span>
                El ranking está{" "}
                <span className="uppercase tracking-wider">
                  {visible ? "VISIBLE" : "OCULTO"}
                </span>{" "}
                para los equipos
              </div>
            </div>

            {/* Big toggle switch */}
            <button
              onClick={toggle}
              disabled={saving}
              className="flex-shrink-0 relative w-16 h-9 rounded-full transition-all duration-300 disabled:opacity-50"
              style={{
                background: visible
                  ? "var(--accent-green)"
                  : "var(--bg-elevated)",
                border: `2px solid ${visible ? "var(--accent-green)" : "var(--border-active)"}`,
                boxShadow: visible ? "0 0 12px rgba(0,255,136,0.3)" : "none",
              }}
              aria-label="Toggle ranking visibility"
            >
              <span
                className="absolute top-1 w-5 h-5 rounded-full transition-all duration-300"
                style={{
                  background: visible ? "#000" : "var(--text-muted)",
                  left: visible ? "calc(100% - 1.5rem)" : "0.25rem",
                }}
              />
            </button>
          </div>

          <div
            className="mt-6 pt-5"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <p className="font-mono text-xs mb-3" style={{ color: "var(--text-muted)" }}>
              ¿Qué ven los equipos cuando el ranking está oculto?
            </p>
            <div
              className="rounded-xl p-4 text-center font-mono text-xs"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            >
              🔒 &quot;El ranking está oculto... por ahora.&quot;
              <br />
              <span className="opacity-50">[ACCESO DENEGADO — NIVEL DE CLASIFICACIÓN INSUFICIENTE]</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="mt-6">
        <p className="font-mono text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          Vista previa desde el panel público:
        </p>
        <Link
          href="/ranking"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
          style={{ color: "var(--accent-cyan)" }}
        >
          → Ver /ranking (abre en nueva pestaña)
        </Link>
      </div>
    </div>
  )
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div
      className="fixed top-4 right-4 z-[60] px-4 py-2.5 rounded-lg font-mono text-sm font-bold animate-fade-in-scale"
      style={{ background: ok ? "var(--accent-green)" : "var(--accent-red)", color: "#000" }}
    >
      {msg}
    </div>
  )
}
