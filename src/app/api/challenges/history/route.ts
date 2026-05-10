import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const phases = await prisma.phase.findMany({
      include: {
        challenges: {
          where: { status: "finished" },
          include: {
            winner_team: { select: { id: true, name: true } },
            submissions: {
              select: {
                id: true,
                team: { select: { name: true } },
                answer: true,
                created_at: true,
                is_valid: true,
              },
              orderBy: { created_at: "asc" },
            },
          },
          orderBy: { created_at: "asc" },
        },
      },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ phases })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
