import { z } from "zod"

export const createPhaseSchema = z.object({
  name: z.string().min(1),
  order: z.number().int().positive(),
  description: z.string().optional(),
})

export const updatePhaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  order: z.number().int().positive().optional(),
  description: z.string().nullable().optional(),
})

export const createChallengeSchema = z.object({
  phase_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  media_urls: z.array(z.string()).optional(),
  end_time: z.string().min(1),
  status: z.enum(["draft", "active", "finished"]).optional(),
  challenge_type: z.enum(["single", "double"]).optional(),
  parent_challenge_id: z.string().nullable().optional(),
  hint_text: z.string().nullable().optional(),
  hint_available_at: z.string().nullable().optional(),
})

export const updateChallengeSchema = z.object({
  id: z.string().min(1),
  phase_id: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  media_urls: z.array(z.string()).optional(),
  end_time: z.string().min(1).optional(),
  status: z.enum(["draft", "active", "finished"]).optional(),
  challenge_type: z.enum(["single", "double"]).optional(),
  parent_challenge_id: z.string().nullable().optional(),
  hint_text: z.string().nullable().optional(),
  hint_available_at: z.string().nullable().optional(),
})

export const createSubmissionSchema = z.object({
  team_id: z.string().min(1),
  secret_code: z.string().min(1),
  challenge_id: z.string().min(1),
  answer: z.string().min(1),
})

export const assignPointsSchema = z.object({
  team_id: z.string().min(1),
  challenge_id: z.string().nullable().optional(),
  points: z.number().int(),
  reason: z.string().min(1),
})

export const setWinnerSchema = z.object({
  team_id: z.string().min(1),
})

export const toggleRankingSchema = z.object({
  visible: z.boolean(),
})

export const createTeamSchema = z.object({
  name: z.string().min(1),
  secret_code: z.string().min(1),
})

export const updateTeamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  secret_code: z.string().min(1).optional(),
})
