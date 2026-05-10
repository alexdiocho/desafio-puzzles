"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface Challenge {
  id: string
  title: string
  status: string
  end_time: string
  phase: { name: string; order: number }
  winner_team: { id: string; name: string } | null
}

interface Submission {
  id: string
  team_name: string
  answer: string
  created_at: string
  is_valid: boolean
}

interface Team {
  id: string
  name: string
}

interface PointLogEntry {
  id: string
  team_name: string
  points: number
  reason: string
  created_at: string
}

const PRESET_REASONS = [
  "1er lugar",
  "Bonus desafío doble",
  "Barrida semanal",
  "Nadie acertó",
  "Razón personalizada",
]

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

export default function RespuestasPage() {
  const params = useParams()
  const secret = params.secret as string
  const challengeId = params.id as string
  const base = `/admin/${secret}`

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [pointLogs, setPointLogs] = useState<PointLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Winner form
  const [winnerId, setWinnerId] = useState("")
  const [savingWinner, setSavingWinner] = useState(false)

  // Points form
  const [ptTeamId, setPtTeamId] = useState("")
  const [ptPoints, setPtPoints] = useState("1")
  const [ptReason, setPtReason] = useState(PRESET_REASONS[0])
  const [ptCustomReason, setPtCustomReason] = useState("")
  const [savingPoints, setSavingPoints] = useState(false)

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const h = { "x-admin-secret": secret }
  const hJson = { ...h, "Content-Type": "application/json" }

  const loadAll = useCallback(async () => {
    const [cRes, sRes, tRes, pRes] = await Promise.all([
      fetch(`/api/admin/challenges/${challengeId}`, { headers: h }),
      fetch(`/api/admin/challenges/${challengeId}/submissions`, { headers: h }),
      fetch("/api/admin/teams", { headers: h }),
      fetch(`/api/admin/points?challenge_id=${challengeId}`, { headers: h }),
    ])
    const [cData, sData, tData, pData] = await Promise.all([
      cRes.json(),
      sRes.json(),
      tRes.json(),
      pRes.json(),
    ])
    setChallenge(cData.challenge ?? null)
    setSubmissions(sData.submissions ?? [])
    setTeams(tData.teams ?? [])
    setPointLogs(pData.point_logs ?? [])
    if (cData.challenge?.winner_team_id) {
      setWinnerId(cData.challenge.winner_team_id)
    }
    if (tData.teams?.length > 0) {
      setPtTeamId(tData.teams[0].id)
    }
  }, [challengeId, secret])

  useEffect(() => {
    loadAll().finally(() => setLoading(false))
  }, [loadAll])

  async function toggleValid(subId: string, current: boolean) {
    try {
      const res = await fetch(`/api/admin/submissions/${subId}`, {
        method: "PATCH",
        headers: hJson,
        body: JSON.stringify({ is_valid: !current }),
      })
      if (!res.ok) throw new Error()
      setSubmissions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, is_valid: !current } : s))
      )
    } catch {
      showToast("Error al actualizar", false)
    }
  }

  async function saveWinner(e: React.FormEvent) {
    e.preventDefault()
    if (!winnerId) return
    setSavingWinner(true)
    try {
      const res = await fetch(`/api/admin/challenges/${challengeId}/winner`, {
        method: "PUT",
        headers: hJson,
        body: JSON.stringify({ team_id: winnerId }),
      })
      if (!res.ok) throw new Error()
      showToast("Ganador asignado")
      await loadAll()
    } catch {
      showToast("Error al asignar ganador", false)
    } finally {
      setSavingWinner(false)
    }
  }

  async function savePoints(e: React.FormEvent) {
    e.preventDefault()
    if (!ptTeamId) return
    const reason = ptReason === "Razón personalizada" ? ptCustomReason : ptReason
    if (!reason.trim()) {
      showToast("Escribe una razón", false)
      return
    }
    setSavingPoints(true)
    try {
      const res = await fetch("/api/admin/points", {
        method: "POST",
        headers: hJson,
        body: JSON.stringify({
          team_id: ptTeamId,
          challenge_id: challengeId,
          points: Number(ptPoints),
          reason,
        }),
      })
      if (!res.ok) throw new Error()
      showToast(`+${ptPoints} pts asignado`)
      setPtCustomReason("")
      await loadAll()
    } catch {
      showToast("Error al asignar puntos", false)
    } finally {
      setSavingPoints(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>CARGANDO...</p>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="p-6">
        <p className="font-mono text-sm" style={{ color: "var(--accent-red)" }}>
          Desafío no encontrado
        </p>
        <Link href={`${base}/desafios`} className="font-mono text-xs mt-2 inline-block" style={{ color: "var(--accent-cyan)" }}>
          ← Volver a desafíos
        </Link>
      </div>
    )
  }

  const isActive = challenge.status === "active"

  return (
    <div className="p-6 max-w-4xl">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-mono text-xs mb-5" style={{ color: "var(--text-muted)" }}>
        <Link href={`${base}/desafios`} className="hover:opacity-80 transition-opacity" style={{ color: "var(--accent-cyan)" }}>
          ← Desafíos
        </Link>
        <span>/</span>
        <span>Respuestas</span>
      </nav>

      {/* Challenge header */}
      <div
        className="rounded-xl p-4 mb-6"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-start gap-3 flex-wrap">
          <span
            className="font-mono text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider mt-0.5"
            style={{ background: `${STATUS_COLORS[challenge.status]}15`, color: STATUS_COLORS[challenge.status], border: `1px solid ${STATUS_COLORS[challenge.status]}33` }}
          >
            {STATUS_LABELS[challenge.status]}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="font-grotesk font-bold text-xl" style={{ color: "var(--text-primary)" }}>
              {challenge.title}
            </h1>
            <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {challenge.phase.name}
              {" · "}
              Fin: {format(new Date(challenge.end_time), "dd/MM/yyyy HH:mm")}
              {isActive && (
                <span style={{ color: "var(--accent-green)" }}>
                  {" · "}
                  {formatDistanceToNow(new Date(challenge.end_time), { locale: es, addSuffix: true })}
                </span>
              )}
            </p>
          </div>
          <p className="font-mono text-sm font-bold mt-0.5" style={{ color: "var(--accent-magenta)" }}>
            {submissions.length} respuesta{submissions.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Submissions table — most important section */}
      <section className="mb-6">
        <h2 className="font-grotesk font-bold text-sm uppercase tracking-widest mb-3" style={{ color: "var(--accent-gold)" }}>
          ◈ Respuestas (orden de llegada)
        </h2>
        {submissions.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ border: "1px dashed var(--border-subtle)" }}>
            <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>
              Sin respuestas todavía
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: "0 4px" }}>
              <thead>
                <tr>
                  {["#", "Equipo", "Respuesta", "Timestamp", "Estado"].map((h) => (
                    <th
                      key={h}
                      className="text-left font-mono text-xs px-3 py-2 uppercase tracking-wider"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, i) => {
                  const isFirst = i === 0
                  return (
                    <tr
                      key={sub.id}
                      style={
                        isFirst
                          ? {
                              background: "rgba(255,215,0,0.07)",
                              outline: "1px solid rgba(255,215,0,0.2)",
                              borderRadius: "8px",
                            }
                          : { background: "var(--bg-secondary)", borderRadius: "8px" }
                      }
                    >
                      <td className="px-3 py-2.5 rounded-l-lg">
                        <span
                          className="font-mono font-bold text-xs w-6 h-6 flex items-center justify-center rounded"
                          style={
                            isFirst
                              ? {
                                  background: "var(--accent-gold)",
                                  color: "#000",
                                  boxShadow: "0 0 8px rgba(255,215,0,0.4)",
                                }
                              : { color: "var(--text-muted)" }
                          }
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="font-medium"
                          style={{ color: isFirst ? "var(--accent-gold)" : "var(--text-primary)" }}
                        >
                          {sub.team_name}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 max-w-xs">
                        <p
                          className="font-mono text-xs truncate"
                          style={{ color: "var(--text-secondary)" }}
                          title={sub.answer}
                        >
                          {sub.answer}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                          {format(new Date(sub.created_at), "dd/MM HH:mm:ss")}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 rounded-r-lg">
                        <button
                          onClick={() => toggleValid(sub.id, sub.is_valid)}
                          className="font-mono text-xs px-2 py-0.5 rounded-full transition-all"
                          style={
                            sub.is_valid
                              ? {
                                  background: "rgba(0,255,136,0.12)",
                                  color: "var(--accent-green)",
                                  border: "1px solid rgba(0,255,136,0.3)",
                                }
                              : {
                                  background: "rgba(85,85,119,0.2)",
                                  color: "var(--text-muted)",
                                  border: "1px solid var(--border-subtle)",
                                }
                          }
                        >
                          {sub.is_valid ? "✓ Válida" : "○ Revisar"}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Assign winner */}
        <section
          className="rounded-xl p-4"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <h2 className="font-grotesk font-bold text-sm uppercase tracking-widest mb-3" style={{ color: "var(--accent-gold)" }}>
            🏆 Asignar ganador
          </h2>
          {challenge.winner_team && (
            <p className="font-mono text-xs mb-3 px-2 py-1 rounded" style={{ background: "rgba(255,215,0,0.1)", color: "var(--accent-gold)" }}>
              Actual: {challenge.winner_team.name}
            </p>
          )}
          <form onSubmit={saveWinner} className="space-y-3">
            <select
              className="input-base text-sm"
              value={winnerId}
              onChange={(e) => setWinnerId(e.target.value)}
              required
            >
              <option value="">Seleccionar equipo</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={savingWinner || !winnerId}
              className="w-full font-mono text-sm font-bold py-2 rounded-lg disabled:opacity-50 transition-opacity hover:opacity-80"
              style={{ background: "var(--accent-gold)", color: "#000" }}
            >
              {savingWinner ? "Guardando..." : "Asignar ganador"}
            </button>
          </form>
        </section>

        {/* Assign points */}
        <section
          className="rounded-xl p-4"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <h2 className="font-grotesk font-bold text-sm uppercase tracking-widest mb-3" style={{ color: "var(--accent-cyan)" }}>
            + Asignar puntos
          </h2>
          <form onSubmit={savePoints} className="space-y-3">
            <select
              className="input-base text-sm"
              value={ptTeamId}
              onChange={(e) => setPtTeamId(e.target.value)}
              required
            >
              <option value="">Equipo</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                className="input-base text-sm"
                style={{ width: "5rem" }}
                type="number"
                value={ptPoints}
                onChange={(e) => setPtPoints(e.target.value)}
                min={-10}
                max={10}
                required
              />
              <select
                className="input-base text-sm flex-1"
                value={ptReason}
                onChange={(e) => setPtReason(e.target.value)}
              >
                {PRESET_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {ptReason === "Razón personalizada" && (
              <input
                className="input-base text-sm"
                value={ptCustomReason}
                onChange={(e) => setPtCustomReason(e.target.value)}
                placeholder="Describe la razón..."
                required
              />
            )}
            <button
              type="submit"
              disabled={savingPoints}
              className="w-full font-mono text-sm font-bold py-2 rounded-lg disabled:opacity-50 transition-opacity hover:opacity-80"
              style={{
                background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-magenta))",
                color: "#fff",
              }}
            >
              {savingPoints ? "Asignando..." : `Asignar ${ptPoints} pts`}
            </button>
          </form>
        </section>
      </div>

      {/* Points already assigned */}
      {pointLogs.length > 0 && (
        <section className="mt-4">
          <h2 className="font-grotesk font-bold text-sm uppercase tracking-widest mb-3" style={{ color: "var(--text-secondary)" }}>
            Puntos asignados en este desafío
          </h2>
          <div className="space-y-1.5">
            {pointLogs.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="font-mono font-bold text-xs w-8 text-center flex-shrink-0"
                    style={{ color: p.points > 0 ? "var(--accent-green)" : "var(--accent-red)" }}
                  >
                    {p.points > 0 ? "+" : ""}{p.points}
                  </span>
                  <span className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>
                    {p.team_name}
                  </span>
                  <span className="font-mono text-xs truncate" style={{ color: "var(--text-muted)" }}>
                    · {p.reason}
                  </span>
                </div>
                <span className="font-mono text-xs flex-shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
                  {format(new Date(p.created_at), "dd/MM HH:mm")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
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
