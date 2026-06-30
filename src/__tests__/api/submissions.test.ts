import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  team: { findUnique: vi.fn() },
  challenge: { findUnique: vi.fn() },
  submission: { findFirst: vi.fn(), create: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { POST } from '@/app/api/submissions/route'

const VALID_TEAM = {
  id: 'team-1',
  name: 'Equipo Alfa',
  secret_code: 'ALFA-2024',
}

const ACTIVE_CHALLENGE = {
  id: 'challenge-1',
  status: 'active',
  end_time: new Date(Date.now() + 60 * 60 * 1000),
  phase_id: 'phase-1',
  title: 'Test Challenge',
  description: 'Test',
  media_urls: [],
  challenge_type: 'single',
  parent_challenge_id: null,
  hint_text: null,
  hint_available_at: null,
  winner_team_id: null,
  created_at: new Date(),
}

const VALID_BODY = {
  team_id: 'team-1',
  secret_code: 'ALFA-2024',
  challenge_id: 'challenge-1',
  answer: 'test answer',
}

const EXISTING_SUBMISSION = {
  id: 'sub-existing',
  team_id: 'team-1',
  challenge_id: 'challenge-1',
  answer: 'prev answer',
  is_valid: true,
  created_at: new Date(),
}

function makeRequest(body: object) {
  return new Request('http://localhost/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma.team.findUnique.mockResolvedValue(VALID_TEAM)
  mockPrisma.challenge.findUnique.mockResolvedValue(ACTIVE_CHALLENGE)
  mockPrisma.submission.findFirst.mockResolvedValue(null)
  mockPrisma.submission.create.mockResolvedValue({
    id: 'sub-new',
    ...VALID_BODY,
    is_valid: true,
    created_at: new Date(),
  })
})

describe('POST /api/submissions — Una sola respuesta por equipo', () => {
  it('permite el primer envío de un equipo', async () => {
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('rechaza un segundo envío del mismo equipo al mismo desafío', async () => {
    mockPrisma.submission.findFirst.mockResolvedValue(EXISTING_SUBMISSION)

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(429)
    const data = await res.json()
    expect(data.error).toMatch(/ya ha enviado/)
  })

  it('permite envío de otro equipo al mismo desafío', async () => {
    const otherTeam = { id: 'team-2', name: 'Equipo Delta', secret_code: 'DELTA-9X' }
    mockPrisma.team.findUnique.mockResolvedValue(otherTeam)
    // team-2 no tiene envío previo
    mockPrisma.submission.findFirst.mockResolvedValue(null)

    const res = await POST(makeRequest({
      team_id: 'team-2',
      secret_code: 'DELTA-9X',
      challenge_id: 'challenge-1',
      answer: 'test answer',
    }))

    expect(res.status).toBe(201)
    // La verificación debe usar team_id, no ser global
    expect(mockPrisma.submission.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ team_id: 'team-2', challenge_id: 'challenge-1' }),
      })
    )
  })
})

describe('POST /api/submissions — Validación de código secreto', () => {
  it('acepta código correcto', async () => {
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(201)
  })

  it('rechaza código incorrecto con 401', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, secret_code: 'WRONG-CODE' }))
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toMatch(/código secreto/i)
  })

  it('devuelve 404 si el equipo no existe', async () => {
    mockPrisma.team.findUnique.mockResolvedValue(null)

    const res = await POST(makeRequest({ ...VALID_BODY, team_id: 'nonexistent-team' }))
    expect(res.status).toBe(404)
  })
})

describe('POST /api/submissions — Validación de estado del desafío', () => {
  it('permite envío a desafío activo y no expirado', async () => {
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(201)
  })

  it('rechaza envío a desafío en draft', async () => {
    mockPrisma.challenge.findUnique.mockResolvedValue({ ...ACTIVE_CHALLENGE, status: 'draft' })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/activo/)
  })

  it('rechaza envío a desafío finished', async () => {
    mockPrisma.challenge.findUnique.mockResolvedValue({ ...ACTIVE_CHALLENGE, status: 'finished' })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(400)
  })

  it('rechaza envío a desafío expirado aunque esté activo', async () => {
    mockPrisma.challenge.findUnique.mockResolvedValue({
      ...ACTIVE_CHALLENGE,
      status: 'active',
      end_time: new Date(Date.now() - 1000), // hace 1 segundo
    })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/expirado/)
  })
})
