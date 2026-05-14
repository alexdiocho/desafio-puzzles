import Link from "next/link"

type Current = "desafio" | "ranking" | "historial"

interface MysteryHeaderProps {
  current: Current
}

const ITEMS: { id: Current; label: string; href: string }[] = [
  { id: "desafio", label: "Desafío", href: "/" },
  { id: "ranking", label: "Ranking", href: "/ranking" },
  { id: "historial", label: "Historial", href: "/historial" },
]

export default function MysteryHeader({ current }: MysteryHeaderProps) {
  return (
    <header className="mystery-header">
      <Link href="/" className="mystery-brand">
        <span className="mystery-brand__mark" aria-hidden>◯</span>
        <span className="mystery-brand__name">DESAFÍO</span>
      </Link>
      <nav className="mystery-nav">
        {ITEMS.map((it) => (
          <Link
            key={it.id}
            href={it.href}
            className={current === it.id ? "is-current" : ""}
          >
            {it.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
