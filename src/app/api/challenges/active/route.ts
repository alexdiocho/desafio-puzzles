import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()
    const challenges = await prisma.challenge.findMany({
      where: { status: "active" },
      include: {
        phase: { select: { id: true, name: true, order: true } },
      },
    })

    const result = challenges.map((c) => {
      const hintVisible =
        c.hint_enabled ||
        (!!c.hint_available_at && c.hint_available_at <= now)
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        media_urls: c.media_urls,
        end_time: c.end_time,
        challenge_type: c.challenge_type,
        phase: c.phase,
        hint_text: hintVisible ? c.hint_text : null,
        hint_image_url: hintVisible ? c.hint_image_url : null,
        hint_available_at: c.hint_available_at,
      }
    })

    return NextResponse.json({ challenges: result })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
