import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/admin"
import { assignPointsSchema } from "@/lib/validations"

export async function POST(request: Request) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const result = assignPointsSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.issues },
        { status: 400 }
      )
    }

    const pointLog = await prisma.pointLog.create({ data: result.data })
    return NextResponse.json({ point_log: pointLog }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
