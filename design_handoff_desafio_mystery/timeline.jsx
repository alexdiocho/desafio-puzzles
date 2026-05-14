// Vertical phase timeline with challenges as pulsing nodes
const { useMemo } = React;

function Node({ ch, active, onSelect, accent }) {
  const isActive = ch.status === "active";
  const isFinished = ch.status === "finished";
  const isSelected = active === ch.id;

  return (
    <button
      onClick={() => onSelect(ch.id)}
      className={`mystery-node ${isSelected ? "is-selected" : ""}`}
      style={{
        "--node-accent": isFinished ? "var(--accent-gold)" : `var(--accent-${accent})`,
      }}
    >
      <span className="mystery-node__dot" aria-hidden>
        {isFinished && <span className="mystery-node__check">✓</span>}
      </span>
      <span className="mystery-node__body">
        <span className="mystery-node__meta">
          <span className="mystery-node__num">#{String(ch.number).padStart(2, "0")}</span>
          {isActive && <span className="mystery-node__live">● LIVE</span>}
          {isFinished && <span className="mystery-node__done">CERRADO</span>}
          {ch.challenge_type === "double" && <span className="mystery-node__tag">×2</span>}
        </span>
        <span className="mystery-node__title">{ch.title}</span>
      </span>
    </button>
  );
}

function PhaseBlock({ phase, active, onSelect, accent }) {
  const empty = phase.challenges.length === 0;
  return (
    <section className={`mystery-phase ${phase.locked ? "is-locked" : ""}`}>
      <header className="mystery-phase__head">
        <span className="mystery-phase__order">{String(phase.order).padStart(2, "0")}</span>
        <div className="mystery-phase__titles">
          <h3 className="mystery-phase__name">{phase.name}</h3>
          <p className="mystery-phase__sub">{phase.subtitle}</p>
        </div>
      </header>
      <div className="mystery-phase__nodes">
        {empty && (
          <p className="mystery-phase__empty">
            {phase.locked ? "// transmisión bloqueada" : "// sin desafíos publicados"}
          </p>
        )}
        {phase.challenges.map((ch) => (
          <Node key={ch.id} ch={ch} active={active} onSelect={onSelect} accent={accent} />
        ))}
      </div>
    </section>
  );
}

function MysteryTimeline({ phases, active, onSelect, accent }) {
  const counts = useMemo(() => {
    let total = 0, done = 0, live = 0;
    phases.forEach((p) => p.challenges.forEach((c) => {
      total++;
      if (c.status === "finished") done++;
      if (c.status === "active") live++;
    }));
    return { total, done, live };
  }, [phases]);

  return (
    <aside className="mystery-timeline">
      <div className="mystery-timeline__chrome">
        <span className="mystery-timeline__label">[ MAPA DE TRANSMISIÓN ]</span>
        <span className="mystery-timeline__counts">
          <b>{counts.live}</b> activos · {counts.done}/{counts.total} resueltos
        </span>
      </div>
      <div className="mystery-timeline__track">
        {phases.map((p) => (
          <PhaseBlock key={p.id} phase={p} active={active} onSelect={onSelect} accent={accent} />
        ))}
      </div>
    </aside>
  );
}

window.MysteryTimeline = MysteryTimeline;
