import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const submissions = await prisma.submission.findMany({
      where: { challenge_id: id },
      select: {
        team: { select: { name: true } },
        created_at: true,
      },
      orderBy: { created_at: "desc" },
      take: 10,
    })

    return NextResponse.json({
      activity: submissions.map((s) => ({
        team_name: s.team.name,
        created_at: s.created_at,
      })),
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
