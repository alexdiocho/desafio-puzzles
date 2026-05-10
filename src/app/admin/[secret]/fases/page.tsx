"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

interface Phase {
  id: string
  name: string
  order: number
  description: string | null
  challenges: { id: string }[]
}

type FormState = { name: string; order: string; description: string }

export default function FasesPage() {
  const params = useParams()
  const secret = params.secret as string

  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Phase | null>(null)
  const [form, setForm] = useState<FormState>({ name: "", order: "1", description: "" })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadPhases() {
    const res = await fetch("/api/admin/phases", {
      headers: { "x-admin-secret": secret },
    })
    const data = await res.json()
    setPhases(data.phases ?? [])
  }

  useEffect(() => {
    loadPhases().finally(() => setLoading(false))
  }, [secret])

  function openCreate() {
    setEditing(null)
    setForm({ name: "", order: String((phases[phases.length - 1]?.order ?? 0) + 1), description: "" })
    setModalOpen(true)
  }

  function openEdit(phase: Phase) {
    setEditing(phase)
    setForm({ name: phase.name, order: String(phase.order), description: phase.description ?? "" })
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const h = { "x-admin-secret": secret, "Content-Type": "application/json" }
    try {
      if (editing) {
        const res = await fetch("/api/admin/phases", {
          method: "PUT",
          headers: h,
          body: JSON.stringify({
            id: editing.id,
            name: form.name,
            order: Number(form.order),
            description: form.description || null,
          }),
        })
        if (!res.ok) throw new Error()
        showToast("Fase actualizada")
      } else {
        const res = await fetch("/api/admin/phases", {
          method: "POST",
          headers: h,
          body: JSON.stringify({
            name: form.name,
            order: Number(form.order),
            description: form.description || undefined,
          }),
        })
        if (!res.ok) throw new Error()
        showToast("Fase creada")
      }
      setModalOpen(false)
      await loadPhases()
    } catch {
      showToast("Error al guardar", false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1
            className="font-grotesk font-bold text-2xl"
            style={{ color: "var(--accent-gold)", textShadow: "0 0 12px rgba(255,215,0,0.3)" }}
          >
            Fases
          </h1>
          <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Gestionar fases del desafío
          </p>
        </div>
        <button
          onClick={openCreate}
          className="font-mono text-sm font-bold px-4 py-2 rounded-lg flex-shrink-0 transition-opacity hover:opacity-80"
          style={{ background: "var(--accent-gold)", color: "#000" }}
        >
          + Nueva fase
        </button>
      </header>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-2">
          {phases.length === 0 && (
            <EmptyState text="No hay fases todavía. Crea la primera." />
          )}
          {phases.map((phase) => (
            <div
              key={phase.id}
              className="rounded-xl p-4 flex items-center justify-between gap-4"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm flex-shrink-0"
                  style={{ background: "rgba(255,215,0,0.12)", color: "var(--accent-gold)" }}
                >
                  {phase.order}
                </div>
                <div className="min-w-0">
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {phase.name}
                  </p>
                  {phase.description && (
                    <p className="font-mono text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                      {phase.description}
                    </p>
                  )}
                  <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {phase.challenges.length} desafío{phase.challenges.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => openEdit(phase)}
                className="font-mono text-xs px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors hover:opacity-80"
                style={{ border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
              >
                Editar
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? "Editar fase" : "Nueva fase"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Nombre">
              <input
                className="input-base"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Fase 1: Calentamiento"
                required
              />
            </Field>
            <Field label="Orden">
              <input
                className="input-base"
                type="number"
                min={1}
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                required
              />
            </Field>
            <Field label="Descripción (opcional)">
              <textarea
                className="input-base"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Descripción de la fase..."
              />
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
      <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>
        CARGANDO...
      </p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="rounded-xl p-8 text-center"
      style={{ border: "1px dashed var(--border-subtle)" }}
    >
      <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>
        {text}
      </p>
    </div>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-active)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-grotesk font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded font-mono text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      {children}
    </div>
  )
}
