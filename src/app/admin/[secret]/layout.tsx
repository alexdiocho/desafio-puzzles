import { notFound } from "next/navigation"
import AdminSidebar from "@/components/admin/AdminSidebar"

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ secret?: string }>
}) {
  const { secret } = await params

  if (secret !== process.env.ADMIN_SECRET) {
    notFound()
  }

  return (
    <div className="flex" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
      <AdminSidebar />
      <main className="flex-1 overflow-auto" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
        {children}
      </main>
    </div>
  )
}
