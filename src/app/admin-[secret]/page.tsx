interface Props {
  params: Promise<{ secret: string }>
}

export default async function AdminPage({ params }: Props) {
  const { secret } = await params

  if (secret !== process.env.ADMIN_SECRET) {
    return <div>404</div>
  }

  return (
    <main>
      <h1>Panel de administración</h1>
    </main>
  )
}
