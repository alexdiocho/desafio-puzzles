"use client"

import { useEffect, useMemo, useRef, useState } from "react"

export interface MysteryChallenge {
  id: string
  title: string
  description: string
  end_time: string
  status: "draft" | "active" | "finished"
  challenge_type: "single" | "double"
  number: number
  phase_id: string
  phase_order: number
  phase_name: string
  winner_name: string | null
  hint_text: string | null
  hint_image_url: string | null
}

export interface MysteryPhase {
  id: string
  order: number
  name: string
  subtitle: string | null
  locked: boolean
  challenges: MysteryChallenge[]
}

export interface MysteryTeam {
  id: string
  name: string
}

interface MysteryHomeProps {
  phases: MysteryPhase[]
  teams: MysteryTeam[]
}

const AMBIENT_LINES = [
  "// canal abierto · esperando transmisión…",
  "// últimas pistas registradas en el archivo",
  "// señal estable · presta atención",
  "// cada respuesta deja una huella",
]

export default function MysteryHome({ phases, teams }: MysteryHomeProps) {
  const allChallenges = useMemo(
    () =>
      phases.flatMap((p) =>
        p.challenges.map((c) => ({ ...c, phase_order: p.order, phase_name: p.name }))
      ),
    [phases]
  )

  const firstActive = useMemo(
    () => allChallenges.find((c) => c.status === "active") ?? allChallenges[0],
    [allChallenges]
  )

  const [selectedId, setSelectedId] = useState<string | undefined>(firstActive?.id)
  const selected = allChallenges.find((c) => c.id === selectedId) ?? firstActive

  const hasAny = allChallenges.length > 0
  const [ambientIndex, setAmbientIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setAmbientIndex((i) => (i + 1) % AMBIENT_LINES.length), 7000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="mystery-stage">
      {hasAny ? (
        <>
          <Timeline phases={phases} active={selectedId} onSelect={setSelectedId} />
          <main className="mystery-canvas">
            <p className="ambient-line" key={ambientIndex}>{AMBIENT_LINES[ambientIndex]}</p>
            {selected ? (
              <Poster challenge={selected} teams={teams} />
            ) : (
              <p className="ambient-line">Selecciona un nodo del mapa.</p>
            )}
          </main>
        </>
      ) : (
        <main className="mystery-canvas mystery-canvas--solo">
          <EmptySignal />
        </main>
      )}
    </div>
  )
}

/* ============================ TIMELINE ============================ */

function Timeline({
  phases,
  active,
  onSelect,
}: {
  phases: MysteryPhase[]
  active: string | undefined
  onSelect: (id: string) => void
}) {
  const counts = useMemo(() => {
    let total = 0
    let done = 0
    let live = 0
    phases.forEach((p) =>
      p.challenges.forEach((c) => {
        total++
        if (c.status === "finished") done++
        if (c.status === "active") live++
      })
    )
    return { total, done, live }
  }, [phases])

  return (
    <aside className="mystery-timeline">
      <div className="mystery-timeline__chrome">
        <span className="mystery-timeline__label">[ MAPA DE TRANSMISIÓN ]</span>
        <span className="mystery-timeline__counts">
          <b>{counts.live}</b> activos · {counts.done}/{counts.total} resueltos
        </span>
      </div>
      <div className="mystery-timeline__track">
        {phases.map((p) => (
          <PhaseBlock key={p.id} phase={p} active={active} onSelect={onSelect} />
        ))}
      </div>
    </aside>
  )
}

function PhaseBlock({
  phase,
  active,
  onSelect,
}: {
  phase: MysteryPhase
  active: string | undefined
  onSelect: (id: string) => void
}) {
  const empty = phase.challenges.length === 0
  return (
    <section className={`mystery-phase ${phase.locked ? "is-locked" : ""}`}>
      <header className="mystery-phase__head">
        <span className="mystery-phase__order">{String(phase.order).padStart(2, "0")}</span>
        <div className="mystery-phase__titles">
          <h3 className="mystery-phase__name">{phase.name}</h3>
          {phase.subtitle && <p className="mystery-phase__sub">{phase.subtitle}</p>}
        </div>
      </header>
      <div className="mystery-phase__nodes">
        {empty && (
          <p className="mystery-phase__empty">
            {phase.locked ? "// transmisión bloqueada" : "// sin desafíos publicados"}
          </p>
        )}
        {phase.challenges.map((c) => (
          <Node key={c.id} challenge={c} active={active} onSelect={onSelect} />
        ))}
      </div>
    </section>
  )
}

function Node({
  challenge,
  active,
  onSelect,
}: {
  challenge: MysteryChallenge
  active: string | undefined
  onSelect: (id: string) => void
}) {
  const isActive = challenge.status === "active"
  const isFinished = challenge.status === "finished"
  const isSelected = active === challenge.id
  const accent = isFinished ? "var(--accent-gold)" : "var(--accent-active)"
  return (
    <button
      onClick={() => onSelect(challenge.id)}
      className={`mystery-node ${isSelected ? "is-selected" : ""}`}
      style={{ "--node-accent": accent } as React.CSSProperties}
    >
      <span className="mystery-node__dot" aria-hidden>
        {isFinished && <span className="mystery-node__check">✓</span>}
      </span>
      <span className="mystery-node__body">
        <span className="mystery-node__meta">
          <span className="mystery-node__num">#{String(challenge.number).padStart(2, "0")}</span>
          {isActive && <span className="mystery-node__live">● LIVE</span>}
          {isFinished && <span className="mystery-node__done">CERRADO</span>}
          {challenge.challenge_type === "double" && <span className="mystery-node__tag">×2</span>}
        </span>
        <span className="mystery-node__title">{challenge.title}</span>
      </span>
    </button>
  )
}

/* ============================ POSTER ============================ */

function Poster({ challenge, teams }: { challenge: MysteryChallenge; teams: MysteryTeam[] }) {
  const isFinished = challenge.status === "finished"
  return (
    <article className="poster" key={challenge.id}>
      <div className="poster__plate">
        <div className="poster__meta">
          <span className="poster__phase">FASE {challenge.phase_order} · {challenge.phase_name}</span>
          <span className={`poster__status status-${challenge.status}`}>
            {isFinished ? "TERMINADO" : "● EN CURSO"}
          </span>
          {challenge.challenge_type === "double" && <span className="poster__double">DOBLE</span>}
        </div>

        <div className="poster__numwrap" aria-hidden>
          <span className="poster__num">{String(challenge.number).padStart(2, "0")}</span>
          <span className="poster__numlbl">EXPEDIENTE</span>
        </div>

        <h1 className="poster__title">{challenge.title}</h1>
        <p className="poster__desc">{challenge.description}</p>

        {isFinished ? (
          <FinishedPoster challenge={challenge} />
        ) : (
          <>
            <PosterTimer endTime={challenge.end_time} />
            <PosterHint
              text={challenge.hint_text}
              imageUrl={challenge.hint_image_url}
            />
            <PosterForm challengeId={challenge.id} teams={teams} />
            <PosterActivity key={challenge.id} challengeId={challenge.id} />
          </>
        )}
      </div>

      <span className="poster__bracket poster__bracket--tl">┌</span>
      <span className="poster__bracket poster__bracket--tr">┐</span>
      <span className="poster__bracket poster__bracket--bl">└</span>
      <span className="poster__bracket poster__bracket--br">┘</span>
    </article>
  )
}

function FinishedPoster({ challenge }: { challenge: MysteryChallenge }) {
  return (
    <div className="poster-finished">
      <span className="poster-finished__lbl">— CASO RESUELTO —</span>
      <div className="poster-finished__winner">
        <span className="poster-finished__star">★</span>
        <span>{challenge.winner_name ?? "Sin ganador registrado"}</span>
      </div>
      <p className="poster-finished__hint">
        El archivo permanece sellado. Sólo permanece la firma del primero en descifrarlo.
      </p>
    </div>
  )
}

function PosterTimer({ endTime }: { endTime: string }) {
  const target = useMemo(() => new Date(endTime).getTime(), [endTime])
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, target - now)
  const h = String(Math.floor(diff / 3_600_000)).padStart(2, "0")
  const m = String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, "0")
  const s = String(Math.floor((diff % 60_000) / 1000)).padStart(2, "0")
  const urgent = diff > 0 && diff < 5 * 60_000

  return (
    <div className={`poster-timer ${urgent ? "is-urgent" : ""}`}>
      <span className="poster-timer__lbl">— TIEMPO RESTANTE —</span>
      <div className="poster-timer__digits">
        <span className="poster-timer__seg"><b>{h}</b><i>HRS</i></span>
        <span className="poster-timer__colon">:</span>
        <span className="poster-timer__seg"><b>{m}</b><i>MIN</i></span>
        <span className="poster-timer__colon">:</span>
        <span className="poster-timer__seg"><b>{s}</b><i>SEG</i></span>
      </div>
    </div>
  )
}

/* ============================ HINT ============================ */

function PosterHint({
  text,
  imageUrl,
}: {
  text: string | null
  imageUrl: string | null
}) {
  const [open, setOpen] = useState(false)
  const hasText = !!text && text.trim().length > 0
  const hasImage = !!imageUrl && imageUrl.trim().length > 0
  if (!hasText && !hasImage) return null

  return (
    <div className="poster-hint">
      <button
        type="button"
        className={`poster-hint__toggle ${open ? "is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="poster-hint__icon" aria-hidden>🔍</span>
        <span>{open ? "OCULTAR PISTA" : "PISTA DESBLOQUEADA"}</span>
        <span className="poster-hint__chevron" aria-hidden>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="poster-hint__body">
          {hasText && <p className="poster-hint__text">{text}</p>}
          {hasImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="poster-hint__img" src={imageUrl!} alt="Pista" />
          )}
        </div>
      )}
    </div>
  )
}

/* ============================ FORM ============================ */

function PosterForm({ challengeId, teams }: { challengeId: string; teams: MysteryTeam[] }) {
  const [teamId, setTeamId] = useState("")
  const [secretCode, setSecretCode] = useState("")
  const [answer, setAnswer] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "spam">("idle")
  const [message, setMessage] = useState("")
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
        body: JSON.stringify({
          team_id: teamId,
          secret_code: secretCode,
          challenge_id: challengeId,
          answer,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus("success")
        setMessage(
          "Respuesta registrada a las " +
            new Date(data.created_at).toLocaleTimeString("es-ES")
        )
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
    <form className="poster-form" onSubmit={handleSubmit}>
      <span className="poster-form__lbl">— ENVIAR RESPUESTA —</span>

      <label className="poster-form__field">
        <span>Equipo</span>
        <select
          className="poster-form__input"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          required
          disabled={isDisabled}
        >
          <option value="" disabled>— Selecciona tu equipo —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </label>

      <label className="poster-form__field">
        <span>Código secreto</span>
        <input
          type="password"
          className="poster-form__input"
          placeholder="••••••"
          value={secretCode}
          onChange={(e) => setSecretCode(e.target.value)}
          required
          disabled={isDisabled}
          autoComplete="off"
        />
      </label>

      <label className="poster-form__field">
        <span>Respuesta</span>
        <textarea
          rows={3}
          className="poster-form__input"
          placeholder="Escribe tu respuesta aquí…"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          required
          disabled={isDisabled}
        />
      </label>

      {message && (
        <div
          className={`poster-form__msg ${
            status === "success" ? "is-success" : status === "spam" ? "is-spam" : "is-error"
          }`}
        >
          {message}
        </div>
      )}

      <button className="poster-form__submit" type="submit" disabled={isDisabled}>
        {status === "loading"
          ? "ENVIANDO…"
          : status === "spam"
            ? `REINTENTAR EN ${formatCooldown(secondsLeft)}`
            : "ENVIAR RESPUESTA"}
      </button>
    </form>
  )
}

/* ============================ ACTIVITY ============================ */

interface ActivityEntry { team_name: string; created_at: string; key: string }

function PosterActivity({ challengeId }: { challengeId: string }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const seenRef = useRef(new Set<string>())

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/challenges/${challengeId}/activity`)
        if (!res.ok) return
        const data = await res.json()
        const incoming: ActivityEntry[] = (data.activity ?? []).map(
          (a: { team_name: string; created_at: string }) => ({
            ...a,
            key: `${a.team_name}-${a.created_at}`,
          })
        )
        if (cancelled) return
        setEntries((prev) => {
          const merged = [
            ...incoming.filter((e) => !seenRef.current.has(e.key)),
            ...prev,
          ]
          incoming.forEach((e) => seenRef.current.add(e.key))
          return merged.slice(0, 6)
        })
      } catch {
        // network error — ignore
      }
    }
    load()
    const id = setInterval(load, 10_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [challengeId])

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className="poster-activity">
      <span className="poster-activity__lbl">● ACTIVIDAD EN VIVO</span>
      {entries.length === 0 ? (
        <p className="poster-activity__row poster-activity__muted">Sin actividad reciente…</p>
      ) : (
        entries.map((entry) => (
          <p className="poster-activity__row" key={entry.key}>
            <em>{entry.team_name}</em> intentó.
            <span>{formatTime(entry.created_at)}</span>
          </p>
        ))
      )}
    </div>
  )
}

/* ============================ EMPTY ============================ */

function EmptySignal() {
  return (
    <div className="empty-signal">
      <div className="empty-signal__bars" aria-hidden>
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="empty-signal__bar"
            style={{ animationDelay: `${(i * 90) % 1800}ms` }}
          />
        ))}
      </div>
      <p className="empty-signal__lbl">[ SEÑAL PERDIDA ]</p>
      <h2 className="empty-signal__title">Ningún desafío activo</h2>
      <p className="empty-signal__sub">
        El siguiente fragmento está siendo cifrado.
        <br />
        <span className="empty-signal__hint">Mantente alerta…</span>
      </p>
      <p className="empty-signal__ambient">{"// reanudando transmisión en T-???"}</p>
    </div>
  )
}
