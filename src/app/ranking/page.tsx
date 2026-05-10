import { prisma } from "@/lib/prisma"
import RankingTable from "@/components/RankingTable"

export const dynamic = "force-dynamic"

async function getRankingData() {
  const config = await prisma.siteConfig.findUnique({ where: { key: "ranking_visible" } })
  if (!config || config.value !== "true") {
    return { visible: false }
  }

  const teams = await prisma.team.findMany({
    include: {
      point_logs: {
        include: { challenge: { select: { title: true } } },
        orderBy: { created_at: "desc" },
      },
    },
  })

  const ranking = teams
    .map((t) => ({
      id: t.id,
      name: t.name,
      total_points: t.point_logs.reduce((s, l) => s + l.points, 0),
      breakdown: t.point_logs.map((l) => ({
        challenge_title: l.challenge?.title ?? null,
        points: l.points,
        reason: l.reason,
      })),
    }))
    .sort((a, b) => b.total_points - a.total_points)

  return { visible: true, ranking }
}

export default async function RankingPage() {
  const data = await getRankingData()

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <header className="mb-8 flex items-center gap-3">
        <span className="text-3xl">🏆</span>
        <h1
          className="font-grotesk font-bold text-3xl"
          style={{ color: "var(--text-primary)" }}
        >
          Ranking
        </h1>
      </header>

      {!data.visible ? (
        <HiddenRanking />
      ) : (
        <RankingTable ranking={data.ranking ?? []} />
      )}
    </main>
  )
}

function HiddenRanking() {
  return (
    <div
      className="rounded-2xl px-6 py-10 text-center relative overflow-hidden"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Glitch overlay */}
      <div
        className="absolute inset-0 animate-glitch pointer-events-none rounded-2xl"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.015) 2px, rgba(0,240,255,0.015) 4px)",
          opacity: 0.5,
        }}
        aria-hidden
      />

      {/* Lock icon */}
      <div className="relative mb-6">
        <p
          className="text-7xl select-none"
          style={{ filter: "drop-shadow(0 0 16px var(--accent-cyan-dim))" }}
        >
          🔒
        </p>
      </div>

      {/* Glitch text effect */}
      <div className="relative inline-block mb-4">
        <h2
          className="font-grotesk font-bold text-2xl"
          style={{ color: "var(--text-primary)" }}
        >
          CLASIFICADO
        </h2>
        <h2
          className="font-grotesk font-bold text-2xl absolute inset-0 animate-glitch pointer-events-none"
          style={{ color: "var(--accent-cyan)", opacity: 0.4 }}
          aria-hidden
        >
          CLASIFICADO
        </h2>
      </div>

      <p
        className="font-mono text-sm max-w-xs mx-auto leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        El ranking está oculto... por ahora.
      </p>

      <p
        className="font-mono text-xs mt-4"
        style={{ color: "var(--text-muted)" }}
      >
        [ACCESO DENEGADO — NIVEL DE CLASIFICACIÓN INSUFICIENTE]
      </p>
    </div>
  )
}
