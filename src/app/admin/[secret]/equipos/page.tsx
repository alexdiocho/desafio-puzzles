"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

interface Team {
  id: string
  name: string
  secret_code: string
}

interface PointLog {
  team_id: string
  points: number
}

type FormState = { name: string; secret_code: string }

export default function EquiposPage() {
  const params = useParams()
  const secret = params.secret as string

  const [teams, setTeams] = useState<Team[]>([])
  const [points, setPoints] = useState<PointLog[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Team | null>(null)
  const [form, setForm] = useState<FormState>({ name: "", secret_code: "" })
  const [showCodes, setShowCodes] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const h = { "x-admin-secret": secret }
  const hJson = { ...h, "Content-Type": "application/json" }

  async function loadAll() {
    const [tRes, pRes] = await Promise.all([
      fetch("/api/admin/teams", { headers: h }),
      fetch("/api/admin/points", { headers: h }),
    ])
    const [tData, pData] = await Promise.all([tRes.json(), pRes.json()])
    setTeams(tData.teams ?? [])
    setPoints(pData.point_logs ?? [])
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false))
  }, [secret])

  function teamPoints(id: string) {
    return points.filter((p) => p.team_id === id).reduce((s, p) => s + p.points, 0)
  }

  function openCreate() {
    setEditing(null)
    setForm({ name: "", secret_code: "" })
    setModalOpen(true)
  }

  function openEdit(team: Team) {
    setEditing(team)
    setForm({ name: team.name, secret_code: team.secret_code })
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch("/api/admin/teams", {
          method: "PUT",
          headers: hJson,
          body: JSON.stringify({ id: editing.id, name: form.name, secret_code: form.secret_code }),
        })
        if (!res.ok) throw new Error()
        showToast("Equipo actualizado")
      } else {
        const res = await fetch("/api/admin/teams", {
          method: "POST",
          headers: hJson,
          body: JSON.stringify({ name: form.name, secret_code: form.secret_code }),
        })
        if (!res.ok) throw new Error()
        showToast("Equipo creado")
      }
      setModalOpen(false)
      await loadAll()
    } catch {
      showToast("Error al guardar", false)
    } finally {
      setSaving(false)
    }
  }

  const ranked = [...teams].sort((a, b) => teamPoints(b.id) - teamPoints(a.id))

  return (
    <div className="p-6 max-w-3xl">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1
            className="font-grotesk font-bold text-2xl"
            style={{ color: "var(--accent-gold)", textShadow: "0 0 12px rgba(255,215,0,0.3)" }}
          >
            Equipos
          </h1>
          <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {teams.length} equipos registrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCodes(!showCodes)}
            className="font-mono text-xs px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            {showCodes ? "Ocultar códigos" : "Mostrar códigos"}
          </button>
          <button
            onClick={openCreate}
            className="font-mono text-sm font-bold px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "var(--accent-gold)", color: "#000" }}
          >
            + Nuevo equipo
          </button>
        </div>
      </header>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-2">
          {ranked.length === 0 && <EmptyState text="No hay equipos. Crea el primero." />}
          {ranked.map((team, i) => {
            const pts = teamPoints(team.id)
            return (
              <div
                key={team.id}
                className="rounded-xl p-4 flex items-center gap-4"
                style={{
                  background: "var(--bg-secondary)",
                  border: `1px solid ${i === 0 && pts > 0 ? "rgba(255,215,0,0.3)" : "var(--border-subtle)"}`,
                }}
              >
                {/* Rank */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm flex-shrink-0"
                  style={
                    i === 0 && pts > 0
                      ? { background: "var(--accent-gold)", color: "#000" }
                      : { background: "var(--bg-elevated)", color: "var(--text-muted)" }
                  }
                >
                  {i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {team.name}
                  </p>
                  {showCodes && (
                    <p
                      className="font-mono text-xs mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded"
                      style={{ background: "var(--bg-elevated)", color: "var(--accent-cyan)" }}
                    >
                      🔑 {team.secret_code}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className="font-mono font-bold text-sm"
                    style={{ color: i === 0 && pts > 0 ? "var(--accent-gold)" : "var(--text-secondary)" }}
                  >
                    {pts} pts
                  </span>
                  <button
                    onClick={() => openEdit(team)}
                    className="font-mono text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                    style={{ border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
                  >
                    Editar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? "Editar equipo" : "Nuevo equipo"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Nombre del equipo">
              <input
                className="input-base"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Equipo Alfa"
                required
              />
            </Field>
            <Field label="Código secreto">
              <input
                className="input-base font-mono"
                value={form.secret_code}
                onChange={(e) => setForm((f) => ({ ...f, secret_code: e.target.value }))}
                placeholder="codigo-secreto-2026"
                required
              />
              <p className="font-mono text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Este código se comparte con el equipo por WhatsApp
              </p>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="font-mono text-sm px-4 py-2 rounded-lg"
                style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="font-mono text-sm px-4 py-2 rounded-lg font-bold disabled:opacity-50"
                style={{ background: "var(--accent-gold)", color: "#000" }}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ── Shared sub-components ──────────────────────────────────────────────────────

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

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-32">
      <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>CARGANDO...</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl p-8 text-center" style={{ border: "1px dashed var(--border-subtle)" }}>
      <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>{text}</p>
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-active)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-grotesk font-bold text-lg" style={{ color: "var(--text-primary)" }}>{title}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded font-mono text-xl" style={{ color: "var(--text-muted)" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
      {children}
    </div>
  )
}
