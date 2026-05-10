import Link from "next/link"

export default function NavBar() {
  return (
    <header className="nav-header sticky top-0 z-50">
      <nav className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="nav-brand font-grotesk text-lg tracking-widest uppercase font-bold">
          ⬡ DESAFÍO
        </Link>
        <div className="flex items-center gap-1">
          <NavLink href="/">Desafío</NavLink>
          <NavLink href="/ranking">Ranking</NavLink>
          <NavLink href="/historial">Historial</NavLink>
        </div>
      </nav>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="nav-link px-3 py-1.5 rounded-md text-sm font-medium">
      {children}
    </Link>
  )
}
