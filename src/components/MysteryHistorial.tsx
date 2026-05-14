"use client"

import { useState } from "react"

export interface HistorialItem {
  id: string
  title: string
  description: string
  closedAt: string
  winner: string | null
  answer: string | null
  totalAttempts: number
  duration: string | null
}

export interface HistorialGroup {
  phase: { id: string; order: number; name: string }
  items: HistorialItem[]
}

interface Props {
  groups: HistorialGroup[]
}

export default function MysteryHistorial({ groups }: Props) {
  const firstOpen = groups.flatMap((g) => g.items)[0]?.id ?? null
  const [openId, setOpenId] = useState<string | null>(firstOpen)

  return (
    <div className="arch-stack">
      {groups.map((g) => (
        <PhaseGroup
          key={g.phase.id}
          group={g}
          openId={openId}
          onToggle={(id) => setOpenId(openId === id ? null : id)}
        />
      ))}
    </div>
  )
}

function PhaseGroup({
  group,
  openId,
  onToggle,
}: {
  group: HistorialGroup
  openId: string | null
  onToggle: (id: string) => void
}) {
  const empty = group.items.length === 0
  return (
    <section className="arch-phase">
      <header className="arch-phase__head">
        <span className="arch-phase__chip">FASE {group.phase.order}</span>
        <h2 className="arch-phase__title">{group.phase.name}</h2>
        <span className="arch-phase__line" />
        <span className="arch-phase__count">
          {empty
            ? "sin cerrar"
            : `${group.items.length} desafío${group.items.length === 1 ? "" : "s"}`}
        </span>
      </header>

      {empty ? (
        <p className="arch-phase__empty">{"// fase en curso · sin expedientes sellados todavía"}</p>
      ) : (
        <div className="arch-phase__list">
          {group.items.map((it) => (
            <ArchiveRow
              key={it.id}
              item={it}
              isOpen={openId === it.id}
              onToggle={() => onToggle(it.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ArchiveRow({
  item,
  isOpen,
  onToggle,
}: {
  item: HistorialItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <article className={`arch-row ${isOpen ? "is-open" : ""}`}>
      <button className="arch-row__head" onClick={onToggle}>
        <span className="arch-row__stamp">CERRADO</span>
        <span className="arch-row__title">{item.title}</span>
        <span className="arch-row__winner">
          {item.winner ? (
            <>
              <span className="arch-row__star">★</span> {item.winner}
            </>
          ) : (
            <span style={{ color: "var(--text-muted)" }}>sin ganador</span>
          )}
        </span>
        <span className="arch-row__date">{formatDate(item.closedAt)}</span>
        <span className="arch-row__caret">{isOpen ? "▾" : "▸"}</span>
      </button>
      {isOpen && (
        <div className="arch-row__body">
          <p className="arch-row__desc">{item.description}</p>
          <dl className="arch-row__grid">
            <div>
              <dt>Respuesta correcta</dt>
              <dd className="arch-row__answer">{item.answer ?? "—"}</dd>
            </div>
            <div>
              <dt>Duración</dt>
              <dd>{item.duration ?? "—"}</dd>
            </div>
            <div>
              <dt>Intentos totales</dt>
              <dd>{item.totalAttempts}</dd>
            </div>
            <div>
              <dt>Cierre</dt>
              <dd>{formatDate(item.closedAt)}</dd>
            </div>
          </dl>
          <p className="arch-row__foot">{"// EXPEDIENTE SELLADO — el archivo permanece para consulta histórica."}</p>
        </div>
      )}
    </article>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
