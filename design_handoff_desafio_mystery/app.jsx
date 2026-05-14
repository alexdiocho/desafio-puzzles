const { useState, useMemo, useEffect } = React;
const { PHASES, TEAMS, AMBIENT_LINES } = window.MYSTERY_DATA;

const ACCENT_MAP = {
  cyan:    { main: "#00f0ff", dim: "#00f0ff33" },
  magenta: { main: "#ff00aa", dim: "#ff00aa33" },
  gold:    { main: "#ffd700", dim: "#ffd70033" },
  green:   { main: "#00ff88", dim: "#00ff8833" },
  violet:  { main: "#a78bfa", dim: "#a78bfa33" },
};

function applyAccent(accent) {
  const c = ACCENT_MAP[accent] || ACCENT_MAP.cyan;
  const root = document.documentElement;
  root.style.setProperty("--accent-active", c.main);
  root.style.setProperty("--accent-active-dim", c.dim);
}

function flattenChallenges(phases) {
  const out = [];
  phases.forEach((p) => p.challenges.forEach((c) => out.push({ ...c, phaseOrder: p.order, phaseName: p.name })));
  return out;
}

function AmbientLine({ lines }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % lines.length), 7000);
    return () => clearInterval(id);
  }, [lines.length]);
  return <p className="ambient-line" key={i}>{lines[i]}</p>;
}

function App() {
  const defaults = /*EDITMODE-BEGIN*/{
    "accent": "cyan",
    "layout": "split",
    "intensity": "medium",
    "scanlines": false,
    "showAmbient": true,
    "showEmpty": false
  }/*EDITMODE-END*/;
  const t = useTweaks(defaults);

  useEffect(() => { applyAccent(t.accent); }, [t.accent]);

  const allChallenges = useMemo(() => flattenChallenges(PHASES), []);
  const firstActive = allChallenges.find((c) => c.status === "active") || allChallenges[0];
  const [activeId, setActiveId] = useState(firstActive?.id);
  const activeCh = allChallenges.find((c) => c.id === activeId);

  const phases = t.showEmpty ? PHASES.map(p => ({ ...p, challenges: [] })) : PHASES;
  const hasAny = phases.some((p) => p.challenges.length > 0);

  return (
    <div className={`mystery-root layout-${t.layout} ${t.scanlines ? "with-scanlines" : ""}`}>
      <MysteryHeader current="desafio" />

      <div className="mystery-stage">
        {hasAny ? (
          <>
            <MysteryTimeline
              phases={phases}
              active={activeId}
              onSelect={setActiveId}
              accent={t.accent}
            />
            <main className="mystery-canvas">
              {t.showAmbient && <AmbientLine lines={AMBIENT_LINES} />}
              {activeCh ? (
                <MysteryPoster
                  ch={activeCh}
                  teams={TEAMS}
                  accent={t.accent}
                  intensity={t.intensity}
                />
              ) : (
                <p className="ambient-line">Selecciona un nodo del mapa.</p>
              )}
            </main>
          </>
        ) : (
          <main className="mystery-canvas mystery-canvas--solo">
            <MysteryEmpty />
          </main>
        )}
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Aspecto">
          <TweakColor
            label="Color de acento"
            value={t.accent}
            onChange={(v) => t.setTweak('accent', v)}
            options={[
              { value: 'cyan',    color: '#00f0ff' },
              { value: 'magenta', color: '#ff00aa' },
              { value: 'gold',    color: '#ffd700' },
              { value: 'green',   color: '#00ff88' },
              { value: 'violet',  color: '#a78bfa' },
            ]}
          />
          <TweakRadio
            label="Intensidad del poster"
            value={t.intensity}
            onChange={(v) => t.setTweak('intensity', v)}
            options={[
              { value: 'low',    label: 'Sutil' },
              { value: 'medium', label: 'Medio' },
              { value: 'high',   label: 'Total' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Composición">
          <TweakRadio
            label="Layout"
            value={t.layout}
            onChange={(v) => t.setTweak('layout', v)}
            options={[
              { value: 'split',  label: 'Mapa + Poster' },
              { value: 'stack',  label: 'Apilado' },
            ]}
          />
          <TweakToggle
            label="Línea ambiental"
            checked={t.showAmbient}
            onChange={(v) => t.setTweak('showAmbient', v)}
          />
          <TweakToggle
            label="Scanlines CRT"
            checked={t.scanlines}
            onChange={(v) => t.setTweak('scanlines', v)}
          />
        </TweakSection>
        <TweakSection title="Estados">
          <TweakToggle
            label="Mostrar estado «señal perdida»"
            checked={t.showEmpty}
            onChange={(v) => t.setTweak('showEmpty', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
