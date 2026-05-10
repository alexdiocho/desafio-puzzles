import { prisma } from "@/lib/prisma"
import ChallengeCard, { type ChallengeData } from "@/components/ChallengeCard"

export const dynamic = "force-dynamic"

async function getActiveChallenges(): Promise<ChallengeData[]> {
  const now = new Date()
  const challenges = await prisma.challenge.findMany({
    where: { status: "active" },
    include: { phase: { select: { id: true, name: true, order: true } } },
    orderBy: { end_time: "asc" },
  })
  return challenges.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    media_urls: c.media_urls,
    end_time: c.end_time.toISOString(),
    created_at: c.created_at.toISOString(),
    challenge_type: c.challenge_type,
    phase: c.phase,
    hint_text: c.hint_available_at && c.hint_available_at <= now ? c.hint_text : null,
    hint_available_at: c.hint_available_at?.toISOString() ?? null,
  }))
}

export default async function HomePage() {
  const challenges = await getActiveChallenges()

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {challenges.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className={
            challenges.length === 1
              ? "max-w-2xl mx-auto"
              : "grid gap-8 md:grid-cols-2"
          }
        >
          {challenges.map((c) => (
            <ChallengeCard key={c.id} challenge={c} />
          ))}
        </div>
      )}
    </main>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      {/* Glitch decoration */}
      <div className="relative mb-8">
        <p
          className="font-mono font-bold text-6xl select-none"
          style={{ color: "var(--border-active)", letterSpacing: "0.2em" }}
        >
          ???
        </p>
        <p
          className="font-mono font-bold text-6xl absolute inset-0 animate-glitch"
          style={{ color: "var(--accent-cyan)", letterSpacing: "0.2em", opacity: 0.3 }}
          aria-hidden
        >
          ???
        </p>
      </div>

      <h2
        className="font-grotesk font-bold text-2xl mb-3"
        style={{ color: "var(--text-primary)" }}
      >
        Ningún desafío activo
      </h2>

      <p
        className="font-mono text-sm max-w-sm leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        El siguiente desafío está siendo preparado.
        <br />
        <span style={{ color: "var(--accent-cyan)" }}>Mantente alerta...</span>
      </p>

      <div
        className="mt-8 px-6 py-2 rounded-full font-mono text-xs tracking-widest uppercase"
        style={{
          border: "1px solid var(--border-subtle)",
          color: "var(--text-muted)",
        }}
      >
        TRANSMISIÓN EN ESPERA
      </div>
    </div>
  )
}
