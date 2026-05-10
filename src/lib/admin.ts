import { NextResponse } from "next/server"

export function checkAdminAuth(request: Request): NextResponse | null {
  const secret = request.headers.get("x-admin-secret")
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
