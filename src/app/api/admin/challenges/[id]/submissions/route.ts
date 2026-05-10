import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/admin"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const { id } = await params
    const submissions = await prisma.submission.findMany({
      where: { challenge_id: id },
      include: {
        team: { select: { name: true } },
      },
      orderBy: { created_at: "asc" },
    })

    return NextResponse.json({
      submissions: submissions.map((s) => ({
        id: s.id,
        team_name: s.team.name,
        answer: s.answer,
        created_at: s.created_at,
        is_valid: s.is_valid,
      })),
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
