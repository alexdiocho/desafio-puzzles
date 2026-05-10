import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/admin"
import { toggleRankingSchema } from "@/lib/validations"

export async function PUT(request: Request) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const result = toggleRankingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.issues },
        { status: 400 }
      )
    }

    const config = await prisma.siteConfig.upsert({
      where: { key: "ranking_visible" },
      update: { value: String(result.data.visible) },
      create: { key: "ranking_visible", value: String(result.data.visible) },
    })
    return NextResponse.json({ config })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
