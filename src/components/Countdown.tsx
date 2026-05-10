"use client"

import { useEffect, useRef, useState } from "react"

interface CountdownProps {
  endTime: string
  createdAt: string
}

interface TimeLeft {
  hours: number
  minutes: number
  seconds: number
  total: number
}

function calcTimeLeft(endTime: string): TimeLeft {
  const total = Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000))
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    total,
  }
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

interface DigitPairProps {
  value: string
  label: string
  isUrgent: boolean
  isCritical: boolean
}

function DigitPair({ value, label, isUrgent, isCritical }: DigitPairProps) {
  const [animKey, setAnimKey] = useState(0)
  const prevValue = useRef(value)

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value
      setAnimKey((k) => k + 1)
    }
  }, [value])

  const color = isCritical
    ? "var(--accent-red)"
    : isUrgent
      ? "var(--accent-red)"
      : "var(--accent-cyan)"

  const textGlow = isCritical
    ? "text-glow-red"
    : isUrgent
      ? "text-glow-red"
      : "text-glow-cyan"

  const animClass = isCritical ? "animate-blink" : isUrgent ? "animate-glow-pulse-fast" : "animate-glow-pulse"

  return (
    <div className="flex flex-col items-center">
      <span
        key={animKey}
        className={`font-mono font-bold tabular-nums leading-none ${textGlow} ${animClass}`}
        style={{
          fontSize: "clamp(2.5rem, 8vw, 3.5rem)",
          color,
          display: "inline-block",
          animation: animKey > 0
            ? `digit-flip 200ms ease-in-out, ${animClass.replace("animate-", "")} ${isCritical ? "0.5s" : isUrgent ? "0.5s" : "2s"} ease-in-out ${animKey > 0 ? "200ms" : ""} infinite`
            : undefined,
        }}
      >
        {value}
      </span>
      <span
        className="text-xs tracking-widest uppercase mt-1"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
      >
        {label}
      </span>
    </div>
  )
}

export default function Countdown({ endTime, createdAt }: CountdownProps) {
  const [time, setTime] = useState<TimeLeft>(() => calcTimeLeft(endTime))

  useEffect(() => {
    const tick = () => setTime(calcTimeLeft(endTime))
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endTime])

  const isUrgent = time.total < 300 && time.total > 0
  const isCritical = time.total < 60 && time.total > 0
  const isExpired = time.total === 0

  const totalDuration = Math.max(
    1,
    (new Date(endTime).getTime() - new Date(createdAt).getTime()) / 1000
  )
  const progressPct = Math.min(100, Math.max(0, (time.total / totalDuration) * 100))

  const barColor = isCritical
    ? "var(--accent-red)"
    : isUrgent
      ? "var(--accent-red)"
      : "var(--accent-cyan)"

  const containerGlowClass = isCritical
    ? "glow-red"
    : isUrgent
      ? "glow-red"
      : "glow-cyan"

  if (isExpired) {
    return (
      <div className="rounded-xl p-5 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--accent-red)" }}>
        <p className="font-mono font-bold text-2xl" style={{ color: "var(--accent-red)" }}>
          — TIEMPO AGOTADO —
        </p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl p-5 ${containerGlowClass}`}
      style={{
        background: "var(--bg-elevated)",
        border: `1px solid ${isCritical || isUrgent ? "var(--accent-red)" : "var(--border-active)"}`,
        transition: "border-color 500ms ease, box-shadow 500ms ease",
      }}
    >
      {/* Separator label */}
      <p
        className="text-xs tracking-widest uppercase mb-4 text-center"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
      >
        ── TIEMPO RESTANTE ──
      </p>

      {/* Digits */}
      <div className="flex items-center justify-center gap-3">
        <DigitPair value={pad(time.hours)} label="HRS" isUrgent={isUrgent} isCritical={isCritical} />
        <Colon isUrgent={isUrgent} isCritical={isCritical} />
        <DigitPair value={pad(time.minutes)} label="MIN" isUrgent={isUrgent} isCritical={isCritical} />
        <Colon isUrgent={isUrgent} isCritical={isCritical} />
        <DigitPair value={pad(time.seconds)} label="SEG" isUrgent={isUrgent} isCritical={isCritical} />
      </div>

      {/* Progress bar */}
      <div className="mt-5">
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--border-subtle)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${progressPct}%`,
              background: isCritical || isUrgent
                ? `linear-gradient(90deg, var(--accent-red), var(--accent-magenta))`
                : `linear-gradient(90deg, var(--accent-cyan), var(--accent-magenta))`,
              boxShadow: `0 0 8px ${barColor}`,
            }}
          />
        </div>
        {isUrgent && !isCritical && (
          <p className="text-xs text-center mt-2 font-mono" style={{ color: "var(--accent-red)" }}>
            ⚠ Menos de 5 minutos
          </p>
        )}
        {isCritical && (
          <p
            className="text-xs text-center mt-2 font-mono animate-blink"
            style={{ color: "var(--accent-red)" }}
          >
            ⚠ MENOS DE 1 MINUTO
          </p>
        )}
      </div>
    </div>
  )
}

function Colon({ isUrgent, isCritical }: { isUrgent: boolean; isCritical: boolean }) {
  const color = isCritical || isUrgent ? "var(--accent-red)" : "var(--accent-cyan)"
  return (
    <span
      className="font-mono font-bold animate-glow-pulse"
      style={{
        fontSize: "clamp(2rem, 6vw, 2.8rem)",
        color,
        lineHeight: 1,
        marginBottom: "1.25rem",
      }}
    >
      :
    </span>
  )
}
