const { useState } = React;

const RANKING_DATA = [
  { id: 1, name: "Equipo Alfa",  points: 3, rank: 1, solved: 2, lastWin: "El enigma del faro", motto: "Quien observa, encuentra." },
  { id: 2, name: "Equipo Delta", points: 1, rank: 2, solved: 1, lastWin: "—",                   motto: "Paciencia y luego ataque." },
  { id: 3, name: "Equipo Omega", points: 0, rank: 3, solved: 0, lastWin: "—",                   motto: "Aún calentando motores." },
  { id: 4, name: "Equipo Sigma", points: 0, rank: 4, solved: 0, lastWin: "—",                   motto: "El silencio antes del salto." },
];

const MAX_PTS = Math.max(...RANKING_DATA.map((t) => t.points), 1);

function Row({ team, isOpen, onToggle }) {
  const isLeader = team.rank === 1;
  return (
    <div className={`rank-row rank-row--${team.rank} ${isOpen ? "is-open" : ""} ${isLeader ? "is-leader" : ""}`}>
      <button className="rank-row__head" onClick={onToggle}>
        <span className="rank-row__pos">
          {isLeader ? <span className="rank-row__star">★</span> : `${team.rank}.`}
        </span>
        <span className="rank-row__name">{team.name}</span>
        <span className="rank-row__bar" aria-hidden>
          <span className="rank-row__bar-fill" style={{ width: `${(team.points / MAX_PTS) * 100}%` }} />
        </span>
        <span className="rank-row__pts">
          <b>{team.points}</b> <i>pts</i>
        </span>
        <span className="rank-row__caret">{isOpen ? "▴" : "▾"}</span>
      </button>
      {isOpen && (
        <div className="rank-row__body">
          <div className="rank-row__stats rank-row__stats--solo">
            <div><span>Resueltos</span><b>{team.solved}</b></div>
          </div>
          <p className="rank-row__motto">"{team.motto}"</p>
          {team.lastWin !== "—" && (
            <p className="rank-row__lastwin">
              <span>ÚLTIMA VICTORIA →</span> {team.lastWin}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Podium({ data }) {
  const top = data.slice(0, 3);
  const stage = [top[1], top[0], top[2]].filter(Boolean);
  const heights = { 1: 100, 2: 70, 3: 55 };
  return (
    <div className="podium">
      {stage.map((t) => (
        <div key={t.id} className={`podium__col podium__col--${t.rank}`}>
          <div className="podium__head">
            <span className="podium__name">{t.name}</span>
            <span className="podium__pts">{t.points} pts</span>
          </div>
          <div className="podium__pillar" style={{ height: heights[t.rank] }}>
            <span className="podium__rank">{t.rank}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "pageLocked": false
}/*EDITMODE-END*/;

function App() {
  const [open, setOpen] = useState(1);
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const sorted = [...RANKING_DATA].sort((a, b) => b.points - a.points);

  return (
    <div className="mystery-root">
      <MysteryHeader current="ranking" />
      <main className="page page--ranking">
        {tweaks.pageLocked ? (
          <Locked kind="ranking" />
        ) : (
          <React.Fragment>
            <div className="page__head">
              <p className="page__overline">[ DOSSIER · ESTADO DE LA INVESTIGACIÓN ]</p>
              <h1 className="page__title">Ranking</h1>
              <p className="page__sub">Quien va primero, sabe algo que los demás aún no.</p>
            </div>

            <Podium data={sorted} />

            <section className="rank-list">
              {sorted.map((t) => (
                <Row
                  key={t.id}
                  team={t}
                  isOpen={open === t.id}
                  onToggle={() => setOpen(open === t.id ? null : t.id)}
                />
              ))}
            </section>

            <footer className="page__foot">
              <span>// snapshot continuo · resultados se actualizan tras cada respuesta validada</span>
            </footer>
          </React.Fragment>
        )}
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
