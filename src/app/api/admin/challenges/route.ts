import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/admin"
import { createChallengeSchema, updateChallengeSchema } from "@/lib/validations"

export async function GET(request: Request) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const challenges = await prisma.challenge.findMany({
      include: {
        phase: { select: { name: true, order: true } },
        winner_team: { select: { id: true, name: true } },
      },
      orderBy: { created_at: "asc" },
    })
    return NextResponse.json({ challenges })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const result = createChallengeSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.issues },
        { status: 400 }
      )
    }

    const { end_time, hint_available_at, media_urls, ...rest } = result.data
    const challenge = await prisma.challenge.create({
      data: {
        ...rest,
        end_time: new Date(end_time),
        hint_available_at: hint_available_at ? new Date(hint_available_at) : null,
        media_urls: media_urls ?? [],
      },
    })
    return NextResponse.json({ challenge }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const result = updateChallengeSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.issues },
        { status: 400 }
      )
    }

    const { id, end_time, hint_available_at, ...rest } = result.data
    const challenge = await prisma.challenge.update({
      where: { id },
      data: {
        ...rest,
        ...(end_time !== undefined && { end_time: new Date(end_time) }),
        ...(hint_available_at !== undefined && {
          hint_available_at: hint_available_at
            ? new Date(hint_available_at)
            : null,
        }),
      },
    })
    return NextResponse.json({ challenge })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
