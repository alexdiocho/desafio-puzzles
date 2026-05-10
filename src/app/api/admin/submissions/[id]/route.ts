import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/admin"
import { z } from "zod"

const patchSchema = z.object({
  is_valid: z.boolean(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const result = patchSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.issues },
        { status: 400 }
      )
    }

    const submission = await prisma.submission.update({
      where: { id },
      data: { is_valid: result.data.is_valid },
    })
    return NextResponse.json({ submission })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
