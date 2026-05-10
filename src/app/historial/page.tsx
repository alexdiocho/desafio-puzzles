import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

interface Submission {
  id: string
  team_name: string
  answer: string
  created_at: string
  is_valid: boolean
}

interface ChallengeHistory {
  id: string
  title: string
  created_at: string
  winner: { id: string; name: string } | null
  submissions: Submission[]
}

interface PhaseHistory {
  id: string
  name: string
  order: number
  challenges: ChallengeHistory[]
}

async function getHistory(): Promise<PhaseHistory[]> {
  const phases = await prisma.phase.findMany({
    include: {
      challenges: {
        where: { status: "finished" },
        include: {
          winner_team: { select: { id: true, name: true } },
          submissions: {
            select: {
              id: true,
              answer: true,
              created_at: true,
              is_valid: true,
              team: { select: { name: true } },
            },
            orderBy: { created_at: "asc" },
          },
        },
        orderBy: { created_at: "asc" },
      },
    },
    orderBy: { order: "asc" },
  })

  return phases
    .filter((p) => p.challenges.length > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      order: p.order,
      challenges: p.challenges.map((c) => ({
        id: c.id,
        title: c.title,
        created_at: c.created_at.toISOString(),
        winner: c.winner_team,
        submissions: c.submissions.map((s) => ({
          id: s.id,
          team_name: s.team.name,
          answer: s.answer,
          created_at: s.created_at.toISOString(),
          is_valid: s.is_valid,
        })),
      })),
    }))
}

export default async function HistorialPage() {
  const phases = await getHistory()

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">📜</span>
          <h1 className="font-grotesk font-bold text-3xl" style={{ color: "var(--text-primary)" }}>
            Historial
          </h1>
        </div>
        <p className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
          Archivo de desafíos completados
        </p>
      </header>

      {phases.length === 0 ? (
        <EmptyHistory />
      ) : (
        <div className="flex flex-col gap-8">
          {phases.map((phase) => (
            <PhaseSection key={phase.id} phase={phase} />
          ))}
        </div>
      )}
    </main>
  )
}

function PhaseSection({ phase }: { phase: PhaseHistory }) {
  return (
    <section>
      {/* Phase header */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="font-mono text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded"
          style={{
            background: "var(--accent-cyan-dim)",
            color: "var(--accent-cyan)",
            border: "1px solid var(--accent-cyan-dim)",
          }}
        >
          Fase {phase.order}
        </span>
        <h2 className="font-grotesk font-bold text-xl" style={{ color: "var(--text-primary)" }}>
          {phase.name}
        </h2>
        <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          {phase.challenges.length} desafío{phase.challenges.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Challenges */}
      <div className="flex flex-col gap-3 ml-2">
        {phase.challenges.map((c) => (
          <ChallengeHistoryCard key={c.id} challenge={c} />
        ))}
      </div>
    </section>
  )
}

function ChallengeHistoryCard({ challenge }: { challenge: ChallengeHistory }) {
  const date = new Date(challenge.created_at).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  return (
    <details
      className="rounded-xl overflow-hidden group"
      style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}
    >
      <summary
        className="px-5 py-4 cursor-pointer flex items-center gap-4 list-none"
        style={{ userSelect: "none" }}
      >
        {/* Status badge */}
        <span
          className="font-mono text-xs font-bold px-2 py-0.5 rounded flex-shrink-0"
          style={{
            background: "rgba(136,136,170,0.1)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          CERRADO
        </span>

        {/* Title */}
        <span className="font-grotesk font-bold flex-1" style={{ color: "var(--text-primary)" }}>
          {challenge.title}
        </span>

        {/* Winner */}
        {challenge.winner && (
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <span style={{ color: "var(--accent-gold)" }}>★</span>
            <span className="text-sm font-medium" style={{ color: "var(--accent-gold)" }}>
              {challenge.winner.name}
            </span>
          </span>
        )}

        {/* Date */}
        <span className="text-xs flex-shrink-0 hidden sm:block" style={{ color: "var(--text-muted)" }}>
          {date}
        </span>

        {/* Expand arrow */}
        {challenge.submissions.length > 0 && (
          <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
            ▶
          </span>
        )}
      </summary>

      {/* Submissions */}
      {challenge.submissions.length > 0 && (
        <div
          className="px-5 pb-4"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <p
            className="text-xs tracking-widest uppercase pt-3 pb-2 font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            Respuestas enviadas ({challenge.submissions.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {challenge.submissions.map((s, i) => (
              <div
                key={s.id}
                className="flex items-start gap-3 text-sm rounded-lg px-3 py-2"
                style={{
                  background: i === 0 ? "rgba(0,240,255,0.04)" : "transparent",
                  border: i === 0 ? "1px solid var(--accent-cyan-dim)" : "1px solid transparent",
                }}
              >
                <span
                  className="font-mono text-xs font-bold flex-shrink-0 mt-0.5 w-5 text-center"
                  style={{ color: i === 0 ? "var(--accent-cyan)" : "var(--text-muted)" }}
                >
                  {i + 1}
                </span>
                <span className="font-medium flex-shrink-0" style={{ color: "var(--text-primary)", minWidth: "8rem" }}>
                  {s.team_name}
                </span>
                <span className="flex-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                  {s.answer}
                </span>
                <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                  {new Date(s.created_at).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </details>
  )
}

function EmptyHistory() {
  return (
    <div className="text-center py-16">
      <p className="text-5xl mb-4 select-none">📁</p>
      <h2 className="font-grotesk font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>
        Sin historial todavía
      </h2>
      <p className="font-mono text-sm" style={{ color: "var(--text-secondary)" }}>
        Los desafíos completados aparecerán aquí.
      </p>
    </div>
  )
}
