import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/admin"
import { setWinnerSchema } from "@/lib/validations"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const result = setWinnerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.issues },
        { status: 400 }
      )
    }

    const challenge = await prisma.challenge.update({
      where: { id },
      data: { winner_team_id: result.data.team_id },
    })
    return NextResponse.json({ challenge })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
