import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSubmissionSchema } from "@/lib/validations"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = createSubmissionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.issues },
        { status: 400 }
      )
    }

    const { team_id, secret_code, challenge_id, answer } = result.data

    const team = await prisma.team.findUnique({ where: { id: team_id } })
    if (!team) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
    }
    if (team.secret_code !== secret_code) {
      return NextResponse.json(
        { error: "Código secreto incorrecto" },
        { status: 401 }
      )
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challenge_id },
    })
    if (!challenge) {
      return NextResponse.json(
        { error: "Desafío no encontrado" },
        { status: 404 }
      )
    }
    if (challenge.status !== "active") {
      return NextResponse.json(
        { error: "El desafío no está activo" },
        { status: 400 }
      )
    }
    const now = new Date()
    if (challenge.end_time <= now) {
      return NextResponse.json(
        { error: "El desafío ha expirado" },
        { status: 400 }
      )
    }

    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000)
    const recentSubmission = await prisma.submission.findFirst({
      where: {
        team_id,
        challenge_id,
        created_at: { gte: twoMinutesAgo },
      },
    })
    if (recentSubmission) {
      return NextResponse.json(
        { error: "Debes esperar 2 minutos entre envíos para el mismo desafío" },
        { status: 429 }
      )
    }

    const submission = await prisma.submission.create({
      data: { team_id, challenge_id, answer, is_valid: true },
    })

    return NextResponse.json(
      { success: true, created_at: submission.created_at },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
