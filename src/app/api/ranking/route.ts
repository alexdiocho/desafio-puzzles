import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { key: "ranking_visible" },
    })

    if (!config || config.value !== "true") {
      return NextResponse.json({
        visible: false,
        message: "El ranking está oculto... por ahora",
      })
    }

    const teams = await prisma.team.findMany({
      include: {
        point_logs: {
          include: {
            challenge: { select: { title: true } },
          },
          orderBy: { created_at: "desc" },
        },
      },
    })

    const ranking = teams
      .map((team) => ({
        id: team.id,
        name: team.name,
        total_points: team.point_logs.reduce((sum, log) => sum + log.points, 0),
        breakdown: team.point_logs.map((log) => ({
          challenge_title: log.challenge?.title ?? null,
          points: log.points,
          reason: log.reason,
        })),
      }))
      .sort((a, b) => b.total_points - a.total_points)

    return NextResponse.json({ visible: true, ranking })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
