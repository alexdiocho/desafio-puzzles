import { prisma } from "@/lib/prisma"
import MysteryHeader from "@/components/MysteryHeader"
import MysteryHistorial, {
  type HistorialGroup,
} from "@/components/MysteryHistorial"

export const dynamic = "force-dynamic"

async function getHistorial(): Promise<HistorialGroup[]> {
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
              team_id: true,
            },
            orderBy: { created_at: "asc" },
          },
        },
        orderBy: { created_at: "asc" },
      },
    },
    orderBy: { order: "asc" },
  })

  return phases.map((p) => ({
    phase: { id: p.id, order: p.order, name: p.name },
    items: p.challenges.map((c) => {
      const winnerAnswer =
        c.winner_team_id != null
          ? c.submissions.find((s) => s.team_id === c.winner_team_id)?.answer ?? null
          : null
      const duration = formatDuration(c.created_at, c.end_time)
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        closedAt: c.end_time.toISOString(),
        winner: c.winner_team?.name ?? null,
        answer: winnerAnswer,
        totalAttempts: c.submissions.length,
        duration,
      }
    }),
  }))
}

function formatDuration(start: Date, end: Date): string | null {
  const diff = end.getTime() - start.getTime()
  if (diff <= 0) return null
  const totalMinutes = Math.floor(diff / 60_000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export default async function HistorialPage() {
  const groups = await getHistorial()
  const totalClosed = groups.reduce((acc, g) => acc + g.items.length, 0)
  const totalPhases = groups.length

  return (
    <div className="mystery-root">
      <MysteryHeader current="historial" />
      <main className="page page--historial">
        <div className="page__head">
          <p className="page__overline">[ ARCHIVO · EXPEDIENTES SELLADOS ]</p>
          <h1 className="page__title">Historial</h1>
          <p className="page__sub">
            Lo que se resolvió permanece. Cada caso cerrado deja una firma en el archivo.
          </p>
          <div className="page__stats">
            <span>
              <b>{totalClosed}</b> caso{totalClosed === 1 ? "" : "s"} cerrado
              {totalClosed === 1 ? "" : "s"}
            </span>
            <span className="page__stats-sep">·</span>
            <span>
              <b>{totalPhases}</b> fase{totalPhases === 1 ? "" : "s"} indexada
              {totalPhases === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {totalPhases === 0 ? (
          <p className="arch-phase__empty">{"// sin fases registradas"}</p>
        ) : (
          <MysteryHistorial groups={groups} />
        )}
      </main>
    </div>
  )
}
