import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/admin"
import { createPhaseSchema, updatePhaseSchema } from "@/lib/validations"

export async function GET(request: Request) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const phases = await prisma.phase.findMany({
      include: { challenges: true },
      orderBy: { order: "asc" },
    })
    return NextResponse.json({ phases })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const result = createPhaseSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.issues },
        { status: 400 }
      )
    }

    const phase = await prisma.phase.create({ data: result.data })
    return NextResponse.json({ phase }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const result = updatePhaseSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.issues },
        { status: 400 }
      )
    }

    const { id, ...data } = result.data
    const phase = await prisma.phase.update({ where: { id }, data })
    return NextResponse.json({ phase })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
