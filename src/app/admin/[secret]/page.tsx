"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"

interface Challenge {
  id: string
  title: string
  status: string
  end_time: string
  created_at: string
  phase: { name: string; order: number }
  winner_team: { id: string; name: string } | null
}

interface Team {
  id: string
  name: string
}

interface PointLog {
  id: string
  team_id: string
  points: number
}

interface Submission {
  id: string
  team_name: string
  challenge_title: string
  challenge_id: string
  created_at: string
}

export default function AdminDashboard() {
  const params = useParams()
  const secret = params.secret as string
  const base = `/admin/${secret}`

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [points, setPoints] = useState<PointLog[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const h = { "x-admin-secret": secret }
    Promise.all([
      fetch("/api/admin/challenges", { headers: h }).then((r) => r.json()),
      fetch("/api/admin/teams", { headers: h }).then((r) => r.json()),
      fetch("/api/admin/points", { headers: h }).then((r) => r.json()),
      fetch("/api/admin/submissions?limit=5", { headers: h }).then((r) => r.json()),
    ])
      .then(([c, t, p, s]) => {
        setChallenges(c.challenges ?? [])
        setTeams(t.teams ?? [])
        setPoints(p.point_logs ?? [])
        setSubmissions(s.submissions ?? [])
      })
      .finally(() => setLoading(false))
  }, [secret])

  const activeChals = challenges.filter((c) => c.status === "active")
  const lastFinished = [...challenges]
    .filter((c) => c.status === "finished")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  const ranking = teams
    .map((t) => ({
      ...t,
      total: points.filter((p) => p.team_id === t.id).reduce((s, p) => s + p.points, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>
          CARGANDO...
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl">
      <header className="mb-6">
        <h1
          className="font-grotesk font-bold text-2xl mb-0.5"
          style={{ color: "var(--accent-gold)", textShadow: "0 0 12px rgba(255,215,0,0.3)" }}
        >
          Dashboard
        </h1>
        <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          Panel de control — Desafío Puzzles
        </p>
      </header>

      {/* Stat cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Desafíos activos" value={activeChals.length} color="var(--accent-green)" />
        <StatCard label="Total desafíos" value={challenges.length} color="var(--accent-cyan)" />
        <StatCard label="Equipos" value={teams.length} color="var(--accent-gold)" />
        <StatCard label="Respuestas recientes" value={submissions.length} color="var(--accent-magenta)" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Active challenges */}
        <Section title="◉ Desafíos activos" titleColor="var(--accent-green)">
          {activeChals.length === 0 ? (
            <Empty text="Ningún desafío activo ahora mismo" />
          ) : (
            <ul className="space-y-2.5">
              {activeChals.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {c.title}
                    </p>
                    <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Fin: {format(new Date(c.end_time), "dd/MM HH:mm")}
                    </p>
                  </div>
                  <Link
                    href={`${base}/desafios/${c.id}/respuestas`}
                    className="font-mono text-xs px-2.5 py-1 rounded-lg flex-shrink-0 transition-opacity hover:opacity-80"
                    style={{
                      background: "rgba(255,215,0,0.12)",
                      color: "var(--accent-gold)",
                      border: "1px solid rgba(255,215,0,0.25)",
                    }}
                  >
                    Respuestas
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Top 3 ranking */}
        <Section title="🏆 Ranking (top 3)" titleColor="var(--accent-gold)">
          {ranking.length === 0 ? (
            <Empty text="Sin puntos asignados aún" />
          ) : (
            <ol className="space-y-2">
              {ranking.map((t, i) => (
                <li key={t.id} className="flex items-center justify-between">
                  <span
                    className="font-mono text-sm flex items-center gap-2"
                    style={{ color: i === 0 ? "var(--accent-gold)" : "var(--text-secondary)" }}
                  >
                    <span>{i === 0 ? "★" : i === 1 ? "▲" : "●"}</span>
                    {t.name}
                  </span>
                  <span
                    className="font-mono font-bold text-sm"
                    style={{ color: i === 0 ? "var(--accent-gold)" : "var(--text-primary)" }}
                  >
                    {t.total} pts
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Section>

        {/* Last finished challenge */}
        <Section title="⬡ Último desafío terminado" titleColor="var(--accent-cyan)">
          {!lastFinished ? (
            <Empty text="Ningún desafío terminado aún" />
          ) : (
            <div>
              <p className="font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>
                {lastFinished.title}
              </p>
              <p className="font-mono text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                {lastFinished.phase.name}
              </p>
              {lastFinished.winner_team ? (
                <p className="font-mono text-sm" style={{ color: "var(--accent-gold)" }}>
                  🏆 {lastFinished.winner_team.name}
                </p>
              ) : (
                <p className="font-mono text-xs" style={{ color: "var(--accent-red)" }}>
                  Sin ganador asignado
                </p>
              )}
              <Link
                href={`${base}/desafios/${lastFinished.id}/respuestas`}
                className="font-mono text-xs mt-2 inline-block transition-opacity hover:opacity-80"
                style={{ color: "var(--accent-cyan)" }}
              >
                Ver respuestas →
              </Link>
            </div>
          )}
        </Section>

        {/* Recent submissions */}
        <Section title="● Respuestas recientes" titleColor="var(--accent-magenta)">
          {submissions.length === 0 ? (
            <Empty text="Sin respuestas recientes" />
          ) : (
            <ul className="space-y-2">
              {submissions.map((s) => (
                <li key={s.id}>
                  <p className="font-mono text-xs leading-tight">
                    <span style={{ color: "var(--accent-magenta)" }}>{s.team_name}</span>
                    <span style={{ color: "var(--text-muted)" }}> · {s.challenge_title}</span>
                  </p>
                  <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {format(new Date(s.created_at), "dd/MM HH:mm:ss")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <p className="font-mono text-xs uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="font-grotesk font-bold text-3xl" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

function Section({
  title,
  titleColor,
  children,
}: {
  title: string
  titleColor: string
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-xl p-4"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <h2
        className="font-grotesk font-bold text-xs uppercase tracking-widest mb-3"
        style={{ color: titleColor }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
      {text}
    </p>
  )
}
