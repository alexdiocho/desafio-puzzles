import { prisma } from "@/lib/prisma"
import MysteryHeader from "@/components/MysteryHeader"
import Locked from "@/components/Locked"
import MysteryRanking, { type RankingTeam } from "@/components/MysteryRanking"

export const dynamic = "force-dynamic"

async function getRanking(): Promise<{ visible: boolean; ranking: RankingTeam[] }> {
  const config = await prisma.siteConfig.findUnique({ where: { key: "ranking_visible" } })
  if (!config || config.value !== "true") {
    return { visible: false, ranking: [] }
  }

  const teams = await prisma.team.findMany({
    include: {
      point_logs: {
        include: { challenge: { select: { title: true, created_at: true } } },
        orderBy: { created_at: "desc" },
      },
      won_challenges: { select: { id: true } },
    },
  })

  const ranked = teams
    .map((t) => {
      const points = t.point_logs.reduce((sum, log) => sum + log.points, 0)
      const lastWinLog = t.point_logs.find((l) => l.points > 0 && l.challenge?.title)
      return {
        id: t.id,
        name: t.name,
        points,
        solved: t.won_challenges.length,
        lastWin: lastWinLog?.challenge?.title ?? null,
      }
    })
    .sort((a, b) => b.points - a.points)
    .map((t, i) => ({ ...t, rank: i + 1 }))

  return { visible: true, ranking: ranked }
}

export default async function RankingPage() {
  const { visible, ranking } = await getRanking()

  return (
    <div className="mystery-root">
      <MysteryHeader current="ranking" />
      <main className="page page--ranking">
        {!visible ? (
          <Locked kind="ranking" />
        ) : (
          <>
            <div className="page__head">
              <p className="page__overline">[ DOSSIER · ESTADO DE LA INVESTIGACIÓN ]</p>
              <h1 className="page__title">Ranking</h1>
              <p className="page__sub">Quien va primero, sabe algo que los demás aún no.</p>
            </div>

            <MysteryRanking ranking={ranking} />

            <footer className="page__foot">
              <span>{"// snapshot continuo · resultados se actualizan tras cada respuesta validada"}</span>
            </footer>
          </>
        )}
      </main>
    </div>
  )
}
