// Shared "page hidden" state — preserves mystery aesthetic, no emoji lock.
const Locked = ({ kind = "ranking" }) => {
  const copy = {
    ranking: {
      overline: "[ TRANSMISIÓN INTERRUMPIDA · ACCESO RESTRINGIDO ]",
      title: "Clasificado",
      sub: "Los nombres no se cuentan hasta que el administrador lo decida.",
      foot: "// ACCESO DENEGADO — NIVEL DE CLASIFICACIÓN INSUFICIENTE",
    },
    historial: {
      overline: "[ ARCHIVO SELLADO · ACCESO RESTRINGIDO ]",
      title: "Clasificado",
      sub: "El expediente histórico permanece fuera del alcance hasta nuevo aviso.",
      foot: "// ACCESO DENEGADO — NIVEL DE CLASIFICACIÓN INSUFICIENTE",
    },
  }[kind] || {};

  return (
    <section className="locked-panel">
      <div className="locked-panel__stamp" aria-hidden>
        <svg viewBox="0 0 80 100" width="64" height="80">
          <rect x="2" y="38" width="76" height="58" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 38 V22 a24 24 0 0 1 48 0 V38" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="40" cy="64" r="6" fill="currentColor"/>
          <rect x="38" y="64" width="4" height="16" fill="currentColor"/>
        </svg>
        <span className="locked-panel__seal">EXPEDIENTE · CLASIFICADO</span>
      </div>

      <div className="locked-panel__body">
        <p className="locked-panel__overline">{copy.overline}</p>
        <h1 className="locked-panel__title">{copy.title}</h1>
        <p className="locked-panel__sub">{copy.sub}</p>

        <div className="locked-panel__static" aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.13}s` }} />
          ))}
        </div>

        <p className="locked-panel__foot">{copy.foot}</p>
      </div>
    </section>
  );
};

window.Locked = Locked;
