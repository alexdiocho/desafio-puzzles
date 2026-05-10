"use client"

import { useEffect, useRef, useState } from "react"

interface Team {
  id: string
  name: string
}

interface SubmissionFormProps {
  challengeId: string
}

export default function SubmissionForm({ challengeId }: SubmissionFormProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [teamId, setTeamId] = useState("")
  const [secretCode, setSecretCode] = useState("")
  const [answer, setAnswer] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "spam">("idle")
  const [message, setMessage] = useState("")
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load teams
  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((d) => setTeams(d.teams ?? []))
      .catch(() => {})
  }, [])

  // Cooldown countdown
  useEffect(() => {
    if (cooldownUntil === null) return
    const tick = () => {
      const left = Math.ceil((cooldownUntil - Date.now()) / 1000)
      if (left <= 0) {
        setSecondsLeft(0)
        setCooldownUntil(null)
        setStatus("idle")
        if (timerRef.current) clearInterval(timerRef.current)
      } else {
        setSecondsLeft(left)
        setStatus("spam")
      }
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [cooldownUntil])

  function formatCooldown(s: number): string {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, "0")}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === "loading" || status === "spam") return

    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: teamId, secret_code: secretCode, challenge_id: challengeId, answer }),
      })
      const data = await res.json()

      if (res.ok) {
        setStatus("success")
        setMessage("¡Respuesta enviada! Registrada a las " + new Date(data.created_at).toLocaleTimeString("es-ES"))
        setAnswer("")
        setCooldownUntil(Date.now() + 120_000)
      } else if (res.status === 429) {
        setCooldownUntil(Date.now() + 120_000)
        setMessage(data.error ?? "Anti-spam activo.")
      } else {
        setStatus("error")
        setMessage(data.error ?? "Error al enviar.")
      }
    } catch {
      setStatus("error")
      setMessage("Error de conexión. Inténtalo de nuevo.")
    }
  }

  const isDisabled = status === "loading" || status === "spam"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p
        className="text-xs tracking-widest uppercase"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
      >
        ── ENVIAR RESPUESTA ──
      </p>

      {/* Team selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Equipo
        </label>
        <select
          className="input-base"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          required
          disabled={isDisabled}
        >
          <option value="" disabled>
            — Selecciona tu equipo —
          </option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Secret code */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Código secreto
        </label>
        <input
          type="password"
          className="input-base"
          placeholder="••••••••"
          value={secretCode}
          onChange={(e) => setSecretCode(e.target.value)}
          required
          disabled={isDisabled}
          autoComplete="off"
        />
      </div>

      {/* Answer */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Respuesta
        </label>
        <textarea
          className="input-base resize-none"
          placeholder="Escribe tu respuesta aquí..."
          rows={3}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          required
          disabled={isDisabled}
        />
      </div>

      {/* Feedback message */}
      {message && (
        <div
          className="rounded-lg px-4 py-3 text-sm animate-fade-in-scale"
          style={{
            background:
              status === "success"
                ? "rgba(0,255,136,0.1)"
                : status === "spam"
                  ? "rgba(255,51,85,0.1)"
                  : "rgba(255,0,170,0.1)",
            border: `1px solid ${status === "success" ? "var(--accent-green)" : status === "spam" ? "var(--accent-red)" : "var(--accent-magenta)"}`,
            color:
              status === "success"
                ? "var(--accent-green)"
                : status === "spam"
                  ? "var(--accent-red)"
                  : "var(--accent-magenta)",
          }}
        >
          {message}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        className="btn-primary w-full"
        disabled={isDisabled}
      >
        {status === "loading" ? (
          "Enviando..."
        ) : status === "spam" ? (
          `Puedes reintentar en ${formatCooldown(secondsLeft)}`
        ) : (
          "ENVIAR RESPUESTA"
        )}
      </button>
    </form>
  )
}
