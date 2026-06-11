import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { checkAdminAuth } from "@/lib/admin"

export const dynamic = "force-dynamic"

const MAX_BYTES = 4.5 * 1024 * 1024 // 4.5MB — límite de payload de la serverless function
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]

export async function POST(request: Request) {
  const authError = checkAdminAuth(request)
  if (authError) return authError

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Almacenamiento no configurado: falta BLOB_READ_WRITE_TOKEN" },
      { status: 500 }
    )
  }

  try {
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de imagen no permitido (usa PNG, JPG, WEBP, GIF o AVIF)" },
        { status: 400 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "La imagen supera el límite de 4.5MB" },
        { status: 400 }
      )
    }

    const blob = await put(`challenges/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 })
  }
}
