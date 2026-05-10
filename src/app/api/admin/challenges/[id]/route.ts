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
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        phase: { select: { name: true, order: true } },
        winner_team: { select: { id: true, name: true } },
      },
    })

    if (!challenge) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ challenge })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
