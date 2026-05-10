import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/admin"
import { assignPointsSchema } from "@/lib/validations"

export async function GET(request: Request) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const challengeId = searchParams.get("challenge_id")

    const pointLogs = await prisma.pointLog.findMany({
      where: challengeId ? { challenge_id: challengeId } : undefined,
      include: {
        team: { select: { name: true } },
        challenge: { select: { title: true } },
      },
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json({
      point_logs: pointLogs.map((p) => ({
        id: p.id,
        team_id: p.team_id,
        team_name: p.team.name,
        challenge_id: p.challenge_id,
        challenge_title: p.challenge?.title ?? null,
        points: p.points,
        reason: p.reason,
        created_at: p.created_at,
      })),
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const result = assignPointsSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.issues },
        { status: 400 }
      )
    }

    const pointLog = await prisma.pointLog.create({ data: result.data })
    return NextResponse.json({ point_log: pointLog }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
