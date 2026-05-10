"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { format } from "date-fns"

interface Phase {
  id: string
  name: string
  order: number
}

interface Challenge {
  id: string
  title: string
  description: string
  media_urls: unknown
  end_time: string
  status: "draft" | "active" | "finished"
  challenge_type: "single" | "double"
  parent_challenge_id: string | null
  hint_text: string | null
  hint_available_at: string | null
  phase: { name: string; order: number }
  winner_team: { id: string; name: string } | null
  phase_id?: string
}

type ChallengeForm = {
  title: string
  description: string
  media_urls: string[]
  phase_id: string
  challenge_type: "single" | "double"
  parent_challenge_id: string
  end_time: string
  hint_text: string
  hint_available_at: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: "BORRADOR",
  active: "ACTIVO",
  finished: "TERMINADO",
}
const STATUS_COLORS: Record<string, string> = {
  draft: "var(--text-muted)",
  active: "var(--accent-green)",
  finished: "var(--accent-cyan)",
}
const STATUS_BG: Record<string, string> = {
  draft: "rgba(85,85,119,0.15)",
  active: "rgba(0,255,136,0.08)",
  finished: "rgba(0,240,255,0.08)",
}

function toDatetimeLocal(isoStr: string): string {
  const d = new Date(isoStr)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, "0")
  const dy = String(d.getDate()).padStart(2, "0")
  const h = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  return `${y}-${mo}-${dy}T${h}:${mi}`
}

const EMPTY_FORM: ChallengeForm = {
  title: "",
  description: "",
  media_urls: [],
  phase_id: "",
  challenge_type: "single",
  parent_challenge_id: "",
  end_time: "",
  hint_text: "",
  hint_available_at: "",
}

export default function DesafiosPage() {
  const params = useParams()
  const secret = params.secret as string
  const base = `/admin/${secret}`

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPhase, setFilterPhase] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Challenge | null>(null)
  const [form, setForm] = useState<ChallengeForm>(EMPTY_FORM)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const h = { "x-admin-secret": secret }
  const hJson = { ...h, "Content-Type": "application/json" }

  async function loadAll() {
    const [cRes, pRes] = await Promise.all([
      fetch("/api/admin/challenges", { headers: h }),
      fetch("/api/admin/phases", { headers: h }),
    ])
    const [cData, pData] = await Promise.all([cRes.json(), pRes.json()])
    setChallenges(cData.challenges ?? [])
    setPhases(pData.phases ?? [])
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false))
  }, [secret])

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, phase_id: phases[0]?.id ?? "" })
    setPreview(false)
    setModalOpen(true)
  }

  function openEdit(c: Challenge) {
    setEditing(c)
    setForm({
      title: c.title,
      description: c.description,
      media_urls: Array.isArray(c.media_urls) ? (c.media_urls as string[]) : [],
      phase_id: (c as Challenge & { phase_id?: string }).phase_id ?? "",
      challenge_type: c.challenge_type,
      parent_challenge_id: c.parent_challenge_id ?? "",
      end_time: toDatetimeLocal(c.end_time),
      hint_text: c.hint_text ?? "",
      hint_available_at: c.hint_available_at ? toDatetimeLocal(c.hint_available_at) : "",
    })
    setPreview(false)
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title,
      description: form.description,
      media_urls: form.media_urls.filter((u) => u.trim()),
      phase_id: form.phase_id,
      challenge_type: form.challenge_type,
      parent_challenge_id: form.parent_challenge_id || null,
      end_time: new Date(form.end_time).toISOString(),
      hint_text: form.hint_text || null,
      hint_available_at: form.hint_available_at
        ? new Date(form.hint_available_at).toISOString()
        : null,
    }
    try {
      if (editing) {
        const res = await fetch("/api/admin/challenges", {
          method: "PUT",
          headers: hJson,
          body: JSON.stringify({ id: editing.id, ...payload }),
        })
        if (!res.ok) throw new Error()
        showToast("Desafío actualizado")
      } else {
        const res = await fetch("/api/admin/challenges", {
          method: "POST",
          headers: hJson,
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        showToast("Desafío creado")
      }
      setModalOpen(false)
      await loadAll()
    } catch {
      showToast("Error al guardar", false)
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(id: string, status: string) {
    const labels: Record<string, string> = {
      active: "activar",
      finished: "finalizar",
      draft: "volver a borrador",
    }
    if (!confirm(`¿Seguro que quieres ${labels[status]} este desafío?`)) return
    try {
      const res = await fetch("/api/admin/challenges", {
        method: "PUT",
        headers: hJson,
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error()
      showToast("Estado actualizado")
      await loadAll()
    } catch {
      showToast("Error al cambiar estado", false)
    }
  }

  const filtered = challenges.filter((c) => {
    if (filterPhase && c.phase.name !== phases.find((p) => p.id === filterPhase)?.name) return false
    if (filterStatus && c.status !== filterStatus) return false
    return true
  })

  return (
    <div className="p-6 max-w-5xl">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <header className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1
            className="font-grotesk font-bold text-2xl"
            style={{ color: "var(--accent-gold)", textShadow: "0 0 12px rgba(255,215,0,0.3)" }}
          >
            Desafíos
          </h1>
          <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {challenges.length} en total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="font-mono text-sm font-bold px-4 py-2 rounded-lg flex-shrink-0 transition-opacity hover:opacity-80"
          style={{ background: "var(--accent-gold)", color: "#000" }}
        >
          + Nuevo desafío
        </button>
      </header>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          className="input-base text-sm"
          style={{ width: "auto" }}
          value={filterPhase}
          onChange={(e) => setFilterPhase(e.target.value)}
        >
          <option value="">Todas las fases</option>
          {phases.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="input-base text-sm"
          style={{ width: "auto" }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="active">Activo</option>
          <option value="finished">Terminado</option>
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState text="No hay desafíos que coincidan con los filtros." />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <ChallengeRow
              key={c.id}
              challenge={c}
              base={base}
              onEdit={() => openEdit(c)}
              onStatusChange={changeStatus}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <ChallengeModal
          editing={editing}
          form={form}
          setForm={setForm}
          phases={phases}
          challenges={challenges}
          preview={preview}
          setPreview={setPreview}
          saving={saving}
          onSubmit={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

// ── Challenge row ──────────────────────────────────────────────────────────────

function ChallengeRow({
  challenge: c,
  base,
  onEdit,
  onStatusChange,
}: {
  challenge: Challenge
  base: string
  onEdit: () => void
  onStatusChange: (id: string, status: string) => void
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-start gap-3 flex-wrap">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <span
            className="font-mono text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider"
            style={{ background: STATUS_BG[c.status], color: STATUS_COLORS[c.status], border: `1px solid ${STATUS_COLORS[c.status]}33` }}
          >
            {STATUS_LABELS[c.status]}
          </span>
          <span
            className="font-mono text-xs px-2 py-0.5 rounded"
            style={{ background: "rgba(0,240,255,0.08)", color: "var(--accent-cyan)", border: "1px solid rgba(0,240,255,0.15)" }}
          >
            {c.phase.name}
          </span>
          {c.challenge_type === "double" && (
            <span
              className="font-mono text-xs px-2 py-0.5 rounded"
              style={{ background: "var(--accent-magenta-dim)", color: "var(--accent-magenta)" }}
            >
              DOBLE
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
            {c.title}
          </p>
          <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Fin: {format(new Date(c.end_time), "dd/MM/yyyy HH:mm")}
            {c.winner_team && (
              <span style={{ color: "var(--accent-gold)" }}> · 🏆 {c.winner_team.name}</span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <Link
            href={`${base}/desafios/${c.id}/respuestas`}
            className="font-mono text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "rgba(255,215,0,0.12)", color: "var(--accent-gold)", border: "1px solid rgba(255,215,0,0.25)" }}
          >
            Respuestas
          </Link>
          <button
            onClick={onEdit}
            className="font-mono text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
            style={{ border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            Editar
          </button>
          {c.status === "draft" && (
            <button
              onClick={() => onStatusChange(c.id, "active")}
              className="font-mono text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: "rgba(0,255,136,0.12)", color: "var(--accent-green)", border: "1px solid rgba(0,255,136,0.25)" }}
            >
              ▶ Activar
            </button>
          )}
          {c.status === "active" && (
            <button
              onClick={() => onStatusChange(c.id, "finished")}
              className="font-mono text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: "rgba(255,51,85,0.1)", color: "var(--accent-red)", border: "1px solid rgba(255,51,85,0.25)" }}
            >
              ■ Finalizar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Challenge modal form ───────────────────────────────────────────────────────

function ChallengeModal({
  editing,
  form,
  setForm,
  phases,
  challenges,
  preview,
  setPreview,
  saving,
  onSubmit,
  onClose,
}: {
  editing: Challenge | null
  form: ChallengeForm
  setForm: React.Dispatch<React.SetStateAction<ChallengeForm>>
  phases: Phase[]
  challenges: Challenge[]
  preview: boolean
  setPreview: (v: boolean) => void
  saving: boolean
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}) {
  function addMediaUrl() {
    setForm((f) => ({ ...f, media_urls: [...f.media_urls, ""] }))
  }
  function updateMediaUrl(i: number, val: string) {
    setForm((f) => {
      const urls = [...f.media_urls]
      urls[i] = val
      return { ...f, media_urls: urls }
    })
  }
  function removeMediaUrl(i: number) {
    setForm((f) => ({ ...f, media_urls: f.media_urls.filter((_, idx) => idx !== i) }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-active)" }}
      >
        <div
          className="sticky top-0 flex items-center justify-between px-6 py-4"
          style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)", zIndex: 1 }}
        >
          <h2 className="font-grotesk font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            {editing ? "Editar desafío" : "Nuevo desafío"}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded font-mono text-xl"
            style={{ color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-6 pb-6 pt-4 space-y-4">
          {/* Title */}
          <Field label="Título">
            <input
              className="input-base"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="El enigma del faro"
              required
            />
          </Field>

          {/* Description + preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                Descripción (markdown)
              </label>
              <button
                type="button"
                onClick={() => setPreview(!preview)}
                className="font-mono text-xs px-2 py-0.5 rounded"
                style={{
                  background: preview ? "rgba(0,240,255,0.1)" : "transparent",
                  color: preview ? "var(--accent-cyan)" : "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {preview ? "✎ Editar" : "👁 Preview"}
              </button>
            </div>
            {preview ? (
              <div
                className="markdown-content rounded-lg p-3 min-h-[120px]"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.description || "*Sin contenido*"}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                className="input-base font-mono text-sm"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={6}
                placeholder="Describe el desafío en markdown..."
                required
              />
            )}
          </div>

          {/* Phase + Type in a row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fase">
              <select
                className="input-base"
                value={form.phase_id}
                onChange={(e) => setForm((f) => ({ ...f, phase_id: e.target.value }))}
                required
              >
                <option value="">Seleccionar fase</option>
                {phases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipo">
              <select
                className="input-base"
                value={form.challenge_type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    challenge_type: e.target.value as "single" | "double",
                  }))
                }
              >
                <option value="single">Single</option>
                <option value="double">Double</option>
              </select>
            </Field>
          </div>

          {/* End time */}
          <Field label="Fecha y hora de fin">
            <input
              className="input-base"
              type="datetime-local"
              value={form.end_time}
              onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
              required
            />
          </Field>

          {/* Parent challenge */}
          <Field label="Puzzle padre (opcional)">
            <select
              className="input-base"
              value={form.parent_challenge_id}
              onChange={(e) => setForm((f) => ({ ...f, parent_challenge_id: e.target.value }))}
            >
              <option value="">Ninguno</option>
              {challenges
                .filter((c) => !editing || c.id !== editing.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.phase.name})
                  </option>
                ))}
            </select>
          </Field>

          {/* Media URLs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                Media URLs (imágenes / enlaces)
              </label>
              <button
                type="button"
                onClick={addMediaUrl}
                className="font-mono text-xs px-2 py-0.5 rounded"
                style={{ color: "var(--accent-cyan)", border: "1px solid var(--border-subtle)" }}
              >
                + Añadir
              </button>
            </div>
            {form.media_urls.length === 0 ? (
              <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                Sin media. Haz clic en "+ Añadir" para agregar URLs.
              </p>
            ) : (
              <div className="space-y-2">
                {form.media_urls.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="input-base flex-1 font-mono text-sm"
                      value={url}
                      onChange={(e) => updateMediaUrl(i, e.target.value)}
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => removeMediaUrl(i)}
                      className="font-mono text-sm px-2 rounded"
                      style={{ color: "var(--accent-red)", border: "1px solid var(--border-subtle)" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hint */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <p className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent-green)" }}>
              💡 Pista (opcional)
            </p>
            <Field label="Texto de la pista">
              <textarea
                className="input-base font-mono text-sm"
                value={form.hint_text}
                onChange={(e) => setForm((f) => ({ ...f, hint_text: e.target.value }))}
                rows={2}
                placeholder="Mira hacia donde cae el sol..."
              />
            </Field>
            <Field label="Fecha y hora de desbloqueo">
              <input
                className="input-base"
                type="datetime-local"
                value={form.hint_available_at}
                onChange={(e) => setForm((f) => ({ ...f, hint_available_at: e.target.value }))}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
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
              {saving ? "Guardando..." : editing ? "Actualizar" : "Crear desafío"}
            </button>
          </div>
        </form>
      </div>
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
