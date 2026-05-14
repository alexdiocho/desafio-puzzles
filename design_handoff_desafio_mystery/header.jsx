// Shared header used across pages
function MysteryHeader({ current }) {
  const items = [
    { id: "desafio", label: "Desafío", href: "Inicio rediseñado.html" },
    { id: "ranking", label: "Ranking", href: "Ranking.html" },
    { id: "historial", label: "Historial", href: "Historial.html" },
  ];
  return (
    <header className="mystery-header">
      <a className="mystery-brand" href="Inicio rediseñado.html">
        <span className="mystery-brand__mark">◯</span>
        <span className="mystery-brand__name">DESAFÍO</span>
      </a>
      <nav className="mystery-nav">
        {items.map((it) => (
          <a key={it.id} href={it.href} className={current === it.id ? "is-current" : ""}>
            {it.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
window.MysteryHeader = MysteryHeader;
