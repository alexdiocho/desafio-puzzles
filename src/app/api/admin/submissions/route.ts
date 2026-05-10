import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/admin"

export async function GET(request: Request) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const challengeId = searchParams.get("challenge_id")
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100)

    const submissions = await prisma.submission.findMany({
      where: challengeId ? { challenge_id: challengeId } : undefined,
      include: {
        team: { select: { name: true } },
        challenge: { select: { title: true } },
      },
      orderBy: { created_at: "desc" },
      take: limit,
    })

    return NextResponse.json({
      submissions: submissions.map((s) => ({
        id: s.id,
        team_name: s.team.name,
        challenge_title: s.challenge.title,
        challenge_id: s.challenge_id,
        answer: s.answer,
        created_at: s.created_at,
        is_valid: s.is_valid,
      })),
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
