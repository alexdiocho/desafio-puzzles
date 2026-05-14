// Lost-signal empty state
function MysteryEmpty() {
  return (
    <div className="empty-signal">
      <div className="empty-signal__bars">
        {Array.from({ length: 28 }).map((_, i) => (
          <span key={i} className="empty-signal__bar" style={{ animationDelay: `${(i * 90) % 1800}ms` }} />
        ))}
      </div>
      <p className="empty-signal__lbl">[ SEÑAL PERDIDA ]</p>
      <h2 className="empty-signal__title">Ningún desafío activo</h2>
      <p className="empty-signal__sub">
        El siguiente fragmento está siendo cifrado.<br/>
        <span className="empty-signal__hint">Mantente alerta…</span>
      </p>
      <p className="empty-signal__ambient">// reanudando transmisión en T-???</p>
    </div>
  );
}

window.MysteryEmpty = MysteryEmpty;
