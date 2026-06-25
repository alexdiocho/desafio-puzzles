import { prisma } from "@/lib/prisma"
import MysteryHeader from "@/components/MysteryHeader"
import MysteryHome, {
  type MysteryPhase,
  type MysteryTeam,
} from "@/components/MysteryHome"

export const dynamic = "force-dynamic"

async function getPhases(): Promise<MysteryPhase[]> {
  const now = new Date()
  const phases = await prisma.phase.findMany({
    include: {
      challenges: {
        where: { status: { in: ["active", "finished"] } },
        include: { winner_team: { select: { name: true } } },
        orderBy: { created_at: "asc" },
      },
    },
    orderBy: { order: "asc" },
  })

  return phases.map((p) => ({
    id: p.id,
    order: p.order,
    name: p.name,
    subtitle: p.description,
    locked: false,
    challenges: p.challenges.map((c, i) => {
      const hintUnlocked =
        c.hint_enabled || (!!c.hint_available_at && c.hint_available_at <= now)
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        media_urls: Array.isArray(c.media_urls)
          ? (c.media_urls as unknown[])
              .map((m) =>
                typeof m === "string"
                  ? m
                  : m && typeof m === "object" && "url" in m
                    ? String((m as { url: unknown }).url)
                    : ""
              )
              .filter((u) => u.trim().length > 0)
          : [],
        end_time: c.end_time.toISOString(),
        status: c.status as "draft" | "active" | "finished",
        challenge_type: c.challenge_type as "single" | "double",
        number: i + 1,
        phase_id: p.id,
        phase_order: p.order,
        phase_name: p.name,
        winner_name: c.winner_team?.name ?? null,
        hint_text: hintUnlocked ? c.hint_text : null,
        hint_image_url: hintUnlocked ? c.hint_image_url : null,
      }
    }),
  }))
}

async function getTeams(): Promise<MysteryTeam[]> {
  const teams = await prisma.team.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
  return teams
}

export default async function HomePage() {
  const [phases, teams] = await Promise.all([getPhases(), getTeams()])

  return (
    <div className="mystery-root">
      <MysteryHeader current="desafio" />
      <MysteryHome phases={phases} teams={teams} />
    </div>
  )
}
