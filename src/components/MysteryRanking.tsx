"use client"

import { useState } from "react"

export interface RankingTeam {
  id: string
  name: string
  points: number
  rank: number
  solved: number
  lastWin: string | null
}

interface Props {
  ranking: RankingTeam[]
}

export default function MysteryRanking({ ranking }: Props) {
  const [openId, setOpenId] = useState<string | null>(ranking[0]?.id ?? null)
  const maxPoints = Math.max(...ranking.map((t) => t.points), 1)

  return (
    <>
      <Podium data={ranking} />

      <section className="rank-list">
        {ranking.map((t) => (
          <Row
            key={t.id}
            team={t}
            maxPoints={maxPoints}
            isOpen={openId === t.id}
            onToggle={() => setOpenId(openId === t.id ? null : t.id)}
          />
        ))}
      </section>
    </>
  )
}

function Podium({ data }: { data: RankingTeam[] }) {
  const top = data.slice(0, 3)
  // visual order: 2 · 1 · 3
  const stage = [top[1], top[0], top[2]].filter(Boolean) as RankingTeam[]
  const heights: Record<number, number> = { 1: 100, 2: 70, 3: 55 }
  if (stage.length === 0) return null
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
  )
}

function Row({
  team,
  maxPoints,
  isOpen,
  onToggle,
}: {
  team: RankingTeam
  maxPoints: number
  isOpen: boolean
  onToggle: () => void
}) {
  const isLeader = team.rank === 1
  return (
    <div className={`rank-row ${isOpen ? "is-open" : ""} ${isLeader ? "is-leader" : ""}`}>
      <button className="rank-row__head" onClick={onToggle}>
        <span className="rank-row__pos">
          {isLeader ? <span className="rank-row__star">★</span> : `${team.rank}.`}
        </span>
        <span className="rank-row__name">{team.name}</span>
        <span className="rank-row__bar" aria-hidden>
          <span
            className="rank-row__bar-fill"
            style={{ width: `${(team.points / maxPoints) * 100}%` }}
          />
        </span>
        <span className="rank-row__pts">
          <b>{team.points}</b> <i>pts</i>
        </span>
        <span className="rank-row__caret">{isOpen ? "▴" : "▾"}</span>
      </button>
      {isOpen && (
        <div className="rank-row__body">
          <div className="rank-row__stats rank-row__stats--solo">
            <div>
              <span>Resueltos</span>
              <b>{team.solved}</b>
            </div>
          </div>
          {team.lastWin && (
            <p className="rank-row__lastwin">
              <span>ÚLTIMA VICTORIA →</span> {team.lastWin}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
