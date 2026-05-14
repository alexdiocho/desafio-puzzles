const { useState, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "pageLocked": false
}/*EDITMODE-END*/;

const HISTORIAL_DATA = [
  {
    phase: { id: 1, order: 1, name: "Fase 1 · Calentamiento" },
    items: [
      {
        id: "h-faro",
        title: "El enigma del faro",
        description: "Un faro sin luz. Tres barcos. Una sola coordenada correcta.",
        closedAt: "2026-05-09T23:30:00",
        winner: "Equipo Alfa",
        answer: "Coordenada N42°·15W",
        totalAttempts: 11,
        duration: "1h 24m",
      },
    ],
  },
  {
    phase: { id: 2, order: 2, name: "Fase 2 · Puzzles conectados" },
    items: [],
  },
];

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function ArchiveRow({ item, isOpen, onToggle }) {
  return (
    <article className={`arch-row ${isOpen ? "is-open" : ""}`}>
      <button className="arch-row__head" onClick={onToggle}>
        <span className="arch-row__stamp">CERRADO</span>
        <span className="arch-row__title">{item.title}</span>
        <span className="arch-row__winner">
          <span className="arch-row__star">★</span> {item.winner}
        </span>
        <span className="arch-row__date">{formatDate(item.closedAt)}</span>
        <span className="arch-row__caret">{isOpen ? "▾" : "▸"}</span>
      </button>
      {isOpen && (
        <div className="arch-row__body">
          <p className="arch-row__desc">{item.description}</p>
          <dl className="arch-row__grid">
            <div><dt>Respuesta correcta</dt><dd className="arch-row__answer">{item.answer}</dd></div>
            <div><dt>Duración</dt><dd>{item.duration}</dd></div>
            <div><dt>Intentos totales</dt><dd>{item.totalAttempts}</dd></div>
            <div><dt>Cierre</dt><dd>{formatDate(item.closedAt)}</dd></div>
          </dl>
          <p className="arch-row__foot">// EXPEDIENTE SELLADO — el archivo permanece para consulta histórica.</p>
        </div>
      )}
    </article>
  );
}

function PhaseGroup({ group, openId, setOpenId }) {
  const empty = group.items.length === 0;
  return (
    <section className="arch-phase">
      <header className="arch-phase__head">
        <span className="arch-phase__chip">FASE {group.phase.order}</span>
        <h2 className="arch-phase__title">{group.phase.name}</h2>
        <span className="arch-phase__line" />
        <span className="arch-phase__count">{empty ? "sin cerrar" : `${group.items.length} desafío${group.items.length === 1 ? "" : "s"}`}</span>
      </header>
      {empty ? (
        <p className="arch-phase__empty">// fase en curso · sin expedientes sellados todavía</p>
      ) : (
        <div className="arch-phase__list">
          {group.items.map((it) => (
            <ArchiveRow
              key={it.id}
              item={it}
              isOpen={openId === it.id}
              onToggle={() => setOpenId(openId === it.id ? null : it.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function App() {
  const [openId, setOpenId] = useState("h-faro");
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const totals = useMemo(() => {
    const all = HISTORIAL_DATA.flatMap((g) => g.items);
    return { closed: all.length, phases: HISTORIAL_DATA.length };
  }, []);

  if (tweaks.pageLocked) {
    return (
      <div className="mystery-root">
        <MysteryHeader current="historial" />
        <main className="page page--historial">
          <Locked kind="historial" />
        </main>
        <TweaksPanel title="Tweaks">
          <TweakSection label="Estado de la página">
            <TweakToggle
              label="Página oculta (admin)"
              value={tweaks.pageLocked}
              onChange={(v) => setTweak("pageLocked", v)}
            />
          </TweakSection>
        </TweaksPanel>
      </div>
    );
  }

  return (
    <div className="mystery-root">
      <MysteryHeader current="historial" />
      <main className="page page--historial">
        <div className="page__head">
          <p className="page__overline">[ ARCHIVO · EXPEDIENTES SELLADOS ]</p>
          <h1 className="page__title">Historial</h1>
          <p className="page__sub">
            Lo que se resolvió permanece. Cada caso cerrado deja una firma en el archivo.
          </p>
          <div className="page__stats">
            <span><b>{totals.closed}</b> caso{totals.closed === 1 ? "" : "s"} cerrado{totals.closed === 1 ? "" : "s"}</span>
            <span className="page__stats-sep">·</span>
            <span><b>{totals.phases}</b> fase{totals.phases === 1 ? "" : "s"} indexada{totals.phases === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="arch-stack">
          {HISTORIAL_DATA.map((g) => (
            <PhaseGroup key={g.phase.id} group={g} openId={openId} setOpenId={setOpenId} />
          ))}
        </div>
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Estado de la página">
          <TweakToggle
            label="Página oculta (admin)"
            value={tweaks.pageLocked}
            onChange={(v) => setTweak("pageLocked", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
