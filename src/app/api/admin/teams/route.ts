import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/admin"
import { createTeamSchema, updateTeamSchema } from "@/lib/validations"

export async function GET(request: Request) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const teams = await prisma.team.findMany({ orderBy: { name: "asc" } })
    return NextResponse.json({ teams })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const result = createTeamSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.issues },
        { status: 400 }
      )
    }

    const team = await prisma.team.create({ data: result.data })
    return NextResponse.json({ team }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const result = updateTeamSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.issues },
        { status: 400 }
      )
    }

    const { id, ...data } = result.data
    const team = await prisma.team.update({ where: { id }, data })
    return NextResponse.json({ team })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
