// Mystery poster — large typography, dramatic
const { useState, useEffect, useMemo } = React;

function useCountdown(endTime) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = useMemo(() => new Date(endTime).getTime(), [endTime]);
  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
    urgent: diff < 5 * 60_000,
    expired: diff === 0,
  };
}

function PosterTimer({ endTime }) {
  const t = useCountdown(endTime);
  return (
    <div className={`poster-timer ${t.urgent ? "is-urgent" : ""}`}>
      <span className="poster-timer__lbl">— TIEMPO RESTANTE —</span>
      <div className="poster-timer__digits">
        <span className="poster-timer__seg"><b>{t.h}</b><i>HRS</i></span>
        <span className="poster-timer__colon">:</span>
        <span className="poster-timer__seg"><b>{t.m}</b><i>MIN</i></span>
        <span className="poster-timer__colon">:</span>
        <span className="poster-timer__seg"><b>{t.s}</b><i>SEG</i></span>
      </div>
    </div>
  );
}

function FinishedPoster({ ch }) {
  return (
    <div className="poster-finished">
      <span className="poster-finished__lbl">— CASO RESUELTO —</span>
      <div className="poster-finished__winner">
        <span className="poster-finished__star">★</span>
        <span className="poster-finished__name">{ch.winner}</span>
      </div>
      <p className="poster-finished__hint">El archivo permanece sellado. Sólo permanece la firma del primero en descifrarlo.</p>
    </div>
  );
}

function MysteryPoster({ ch, teams, accent, intensity }) {
  const isFinished = ch.status === "finished";

  return (
    <article className={`poster intensity-${intensity}`} key={ch.id}>
      <div className="poster__plate">
        <div className="poster__meta">
          <span className="poster__phase">FASE {ch.phaseOrder} · CALENTAMIENTO</span>
          <span className={`poster__status status-${ch.status}`}>
            {isFinished ? "TERMINADO" : "● EN CURSO"}
          </span>
          {ch.challenge_type === "double" && <span className="poster__double">DOBLE</span>}
        </div>

        <div className="poster__numwrap">
          <span className="poster__num">{String(ch.number).padStart(2, "0")}</span>
          <span className="poster__numlbl">EXPEDIENTE</span>
        </div>

        <h1 className="poster__title">{ch.title}</h1>
        <p className="poster__desc">{ch.description}</p>

        {isFinished ? (
          <FinishedPoster ch={ch} />
        ) : (
          <>
            <PosterTimer endTime={ch.end_time} />
            <form className="poster-form" onSubmit={(e) => e.preventDefault()}>
              <span className="poster-form__lbl">— ENVIAR RESPUESTA —</span>
              <label className="poster-form__field">
                <span>Equipo</span>
                <select className="poster-form__input">
                  <option>— Selecciona tu equipo —</option>
                  {teams.map((t) => <option key={t.id}>{t.name}</option>)}
                </select>
              </label>
              <label className="poster-form__field">
                <span>Código secreto</span>
                <input type="password" className="poster-form__input" placeholder="••••••" />
              </label>
              <label className="poster-form__field">
                <span>Respuesta</span>
                <textarea rows="3" className="poster-form__input" placeholder="Escribe tu respuesta aquí…" />
              </label>
              <button className="poster-form__submit" type="submit">ENVIAR RESPUESTA</button>
            </form>
            <div className="poster-activity">
              <span className="poster-activity__lbl">● ACTIVIDAD EN VIVO</span>
              <p className="poster-activity__row">
                <em>Equipo Omega</em> intentó. <span>00:23:34</span>
              </p>
              <p className="poster-activity__row">
                <em>Equipo Delta</em> intentó. <span>00:21:34</span>
              </p>
              <p className="poster-activity__row poster-activity__muted">
                Sin actividad reciente…
              </p>
            </div>
          </>
        )}
      </div>

      {/* corner brackets */}
      <span className="poster__bracket poster__bracket--tl">┌</span>
      <span className="poster__bracket poster__bracket--tr">┐</span>
      <span className="poster__bracket poster__bracket--bl">└</span>
      <span className="poster__bracket poster__bracket--br">┘</span>
    </article>
  );
}

window.MysteryPoster = MysteryPoster;
