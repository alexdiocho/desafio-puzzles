"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Countdown from "./Countdown"
import SubmissionForm from "./SubmissionForm"
import ActivityFeed from "./ActivityFeed"

interface Phase {
  id: string
  name: string
  order: number
}

export interface ChallengeData {
  id: string
  title: string
  description: string
  media_urls: unknown
  end_time: string
  created_at: string
  challenge_type: string
  phase: Phase
  hint_text: string | null
  hint_image_url: string | null
  hint_available_at: string | null
}

interface ChallengeCardProps {
  challenge: ChallengeData
}

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const [hintOpen, setHintOpen] = useState(false)
  const mediaUrls: string[] = Array.isArray(challenge.media_urls)
    ? (challenge.media_urls as string[])
    : []
  const hasHint = !!challenge.hint_text || !!challenge.hint_image_url

  return (
    <article
      className="card-base card-gradient-border w-full"
      style={{ position: "relative", zIndex: 1 }}
    >
      {/* Phase + status badge */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span
          className="text-xs font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded"
          style={{
            background: "var(--accent-cyan-dim)",
            color: "var(--accent-cyan)",
            border: "1px solid var(--accent-cyan-dim)",
          }}
        >
          {challenge.phase.name}
        </span>
        <span
          className="text-xs font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded"
          style={{
            background: "rgba(0,255,136,0.1)",
            color: "var(--accent-green)",
            border: "1px solid rgba(0,255,136,0.2)",
          }}
        >
          ◉ ACTIVO
        </span>
        {challenge.challenge_type === "double" && (
          <span
            className="text-xs font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded"
            style={{
              background: "var(--accent-magenta-dim)",
              color: "var(--accent-magenta)",
              border: "1px solid var(--accent-magenta-dim)",
            }}
          >
            DOBLE
          </span>
        )}
      </div>

      {/* Title */}
      <h1
        className="font-grotesk font-bold mb-4"
        style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", color: "var(--text-primary)" }}
      >
        {challenge.title}
      </h1>

      {/* Description */}
      <div className="markdown-content mb-5">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{challenge.description}</ReactMarkdown>
      </div>

      {/* Media images */}
      {mediaUrls.length > 0 && (
        <div className="flex flex-col gap-3 mb-5">
          {mediaUrls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`Media ${i + 1}`}
              className="w-full rounded-lg"
              style={{ border: "1px solid var(--border-subtle)", maxHeight: "400px", objectFit: "contain" }}
            />
          ))}
        </div>
      )}

      {/* Countdown — sticky on mobile */}
      <div className="sticky top-14 z-10 mb-5 -mx-6 px-6 py-2 md:static md:mx-0 md:px-0 md:py-0">
        <Countdown endTime={challenge.end_time} createdAt={challenge.created_at} />
      </div>

      {/* Hint */}
      {hasHint && (
        <div className="mb-5">
          <button
            onClick={() => setHintOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-medium transition-colors duration-150"
            style={{ color: "var(--accent-green)" }}
          >
            <span>💡</span>
            <span>{hintOpen ? "Ocultar pista" : "Ver pista desbloqueada"}</span>
            <span>{hintOpen ? "▲" : "▼"}</span>
          </button>
          {hintOpen && (
            <div
              className="mt-3 rounded-xl px-4 py-3 animate-fade-in-scale"
              style={{
                background: "rgba(0,255,136,0.06)",
                border: "1px solid rgba(0,255,136,0.25)",
              }}
            >
              {challenge.hint_text && (
                <p
                  className="font-mono text-sm leading-relaxed"
                  style={{ color: "var(--accent-green)" }}
                >
                  {challenge.hint_text}
                </p>
              )}
              {challenge.hint_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={challenge.hint_image_url}
                  alt="Pista"
                  className="w-full rounded-lg mt-3"
                  style={{
                    border: "1px solid rgba(0,255,136,0.25)",
                    maxHeight: "400px",
                    objectFit: "contain",
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Separator */}
      <div
        className="mb-5"
        style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}
      >
        <SubmissionForm challengeId={challenge.id} />
      </div>

      {/* Activity Feed */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
        <ActivityFeed challengeId={challenge.id} />
      </div>
    </article>
  )
}
