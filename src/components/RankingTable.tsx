"use client"

import { useState } from "react"

interface BreakdownEntry {
  challenge_title: string | null
  points: number
  reason: string
}

interface RankingEntry {
  id: string
  name: string
  total_points: number
  breakdown: BreakdownEntry[]
}

interface RankingTableProps {
  ranking: RankingEntry[]
}

export default function RankingTable({ ranking }: RankingTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  function toggle(id: string) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  if (ranking.length === 0) {
    return (
      <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>
        Aún no hay puntos registrados.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {ranking.map((team, i) => {
        const isFirst = i === 0
        const isOpen = expanded === team.id
        return (
          <div key={team.id}>
            <button
              onClick={() => toggle(team.id)}
              className="w-full text-left rounded-xl px-5 py-4 transition-all duration-200"
              style={{
                background: isFirst ? "rgba(255,215,0,0.06)" : "var(--bg-secondary)",
                border: `1px solid ${isFirst ? "var(--accent-gold)" : "var(--border-subtle)"}`,
                boxShadow: isFirst ? "0 0 20px var(--accent-gold-dim), 0 0 40px var(--accent-gold-dim)" : "none",
              }}
            >
              <div className="flex items-center gap-4">
                {/* Position */}
                <span
                  className="font-mono font-bold text-xl w-8 text-center flex-shrink-0"
                  style={{
                    color: isFirst ? "var(--accent-gold)" : "var(--text-muted)",
                    textShadow: isFirst ? "0 0 10px var(--accent-gold-dim)" : "none",
                  }}
                >
                  {isFirst ? "★" : `${i + 1}.`}
                </span>

                {/* Team name */}
                <span
                  className="font-grotesk font-bold flex-1"
                  style={{
                    color: isFirst ? "var(--accent-gold)" : "var(--text-primary)",
                    fontSize: isFirst ? "1.125rem" : "1rem",
                    textShadow: isFirst ? "0 0 10px var(--accent-gold-dim)" : "none",
                  }}
                >
                  {team.name}
                </span>

                {/* Points */}
                <span
                  className="font-mono font-bold text-lg flex-shrink-0"
                  style={{ color: isFirst ? "var(--accent-gold)" : "var(--accent-cyan)" }}
                >
                  {team.total_points} pts
                </span>

                {/* Expand toggle */}
                {team.breakdown.length > 0 && (
                  <span className="text-xs ml-1 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    {isOpen ? "▲" : "▼"}
                  </span>
                )}
              </div>
            </button>

            {/* Breakdown */}
            {isOpen && team.breakdown.length > 0 && (
              <div
                className="mt-1 rounded-xl px-5 py-3 animate-fade-in-scale"
                style={{
                  background: "var(--bg-elevated)",
                  border: `1px solid ${isFirst ? "var(--accent-gold)" : "var(--border-subtle)"}`,
                  borderTop: "none",
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                }}
              >
                <p
                  className="text-xs tracking-widest uppercase mb-3"
                  style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
                >
                  Desglose de puntos
                </p>
                <div className="flex flex-col gap-2">
                  {team.breakdown.map((b, j) => (
                    <div key={j} className="flex items-start gap-3 text-sm">
                      <span
                        className="font-mono font-bold flex-shrink-0"
                        style={{ color: isFirst ? "var(--accent-gold)" : "var(--accent-cyan)", minWidth: "3rem" }}
                      >
                        +{b.points}
                      </span>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span style={{ color: "var(--text-primary)" }}>{b.reason}</span>
                        {b.challenge_title && (
                          <span className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {b.challenge_title}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
