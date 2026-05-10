"use client"

import { useEffect, useRef, useState } from "react"

interface ActivityEntry {
  team_name: string
  created_at: string
  key: string
}

interface ActivityFeedProps {
  challengeId: string
}

export default function ActivityFeed({ challengeId }: ActivityFeedProps) {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [open, setOpen] = useState(true)
  const seenRef = useRef(new Set<string>())

  async function fetchActivity() {
    try {
      const res = await fetch(`/api/challenges/${challengeId}/activity`)
      if (!res.ok) return
      const data = await res.json()
      const incoming: ActivityEntry[] = (data.activity ?? []).map(
        (a: { team_name: string; created_at: string }) => ({
          ...a,
          key: `${a.team_name}-${a.created_at}`,
        })
      )
      setEntries((prev) => {
        const merged = [
          ...incoming.filter((e) => !seenRef.current.has(e.key)),
          ...prev,
        ]
        incoming.forEach((e) => seenRef.current.add(e.key))
        return merged.slice(0, 6)
      })
    } catch {
      // ignore network errors
    }
  }

  useEffect(() => {
    fetchActivity()
    const id = setInterval(fetchActivity, 10_000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId])

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ cursor: "pointer" }}
      >
        <div className="flex items-center gap-2">
          <LiveDot />
          <span
            className="text-xs tracking-widest uppercase font-bold"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
          >
            Actividad en vivo
          </span>
          {entries.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: "var(--accent-cyan-dim)", color: "var(--accent-cyan)" }}
            >
              {entries.length}
            </span>
          )}
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* Entries */}
      {open && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          {entries.length === 0 ? (
            <p className="text-sm py-2" style={{ color: "var(--text-muted)" }}>
              Sin actividad reciente...
            </p>
          ) : (
            entries.map((entry, i) => (
              <FeedEntry key={entry.key} entry={entry} index={i} formatTime={formatTime} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function FeedEntry({
  entry,
  index,
  formatTime,
}: {
  entry: ActivityEntry
  index: number
  formatTime: (s: string) => string
}) {
  const opacity = Math.max(0.35, 1 - index * 0.15)
  return (
    <div
      className="flex items-center gap-2 text-sm animate-slide-in-right"
      style={{ opacity, transition: "opacity 300ms ease" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: "var(--accent-red)", animation: "live-pulse 1.5s ease-out infinite" }}
      />
      <span style={{ color: "var(--text-primary)" }}>
        <strong style={{ color: "var(--accent-cyan)" }}>{entry.team_name}</strong>
        {" "}ha enviado una respuesta
      </span>
      <span className="ml-auto text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
        {formatTime(entry.created_at)}
      </span>
    </div>
  )
}

function LiveDot() {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{
        background: "var(--accent-red)",
        animation: "live-pulse 1.5s ease-out infinite",
      }}
    />
  )
}
