import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  challenge: { findMany: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { GET } from '@/app/api/challenges/active/route'

const BASE_CHALLENGE = {
  id: 'c1',
  phase_id: 'p1',
  title: 'Test Challenge',
  description: 'Test description',
  media_urls: [],
  status: 'active',
  end_time: new Date(Date.now() + 60 * 60 * 1000),
  challenge_type: 'single',
  hint_text: 'La pista secreta',
  hint_image_url: 'https://blob.example/pista.png',
  hint_enabled: false,
  hint_available_at: null,
  winner_team_id: null,
  created_at: new Date(),
  phase: { id: 'p1', name: 'Fase 1', order: 1 },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/challenges/active — Pistas', () => {
  it('hint_text es null cuando hint_available_at está en el futuro', async () => {
    mockPrisma.challenge.findMany.mockResolvedValue([{
      ...BASE_CHALLENGE,
      hint_available_at: new Date(Date.now() + 30 * 60 * 1000),
    }])

    const res = await GET()
    const data = await res.json()

    expect(data.challenges[0].hint_text).toBeNull()
  })

  it('hint_text es visible cuando hint_available_at ya pasó', async () => {
    mockPrisma.challenge.findMany.mockResolvedValue([{
      ...BASE_CHALLENGE,
      hint_available_at: new Date(Date.now() - 5 * 60 * 1000),
    }])

    const res = await GET()
    const data = await res.json()

    expect(data.challenges[0].hint_text).toBe('La pista secreta')
  })

  it('hint_image_url sigue la misma puerta de desbloqueo que el texto', async () => {
    mockPrisma.challenge.findMany.mockResolvedValueOnce([{
      ...BASE_CHALLENGE,
      hint_available_at: new Date(Date.now() + 30 * 60 * 1000),
    }])
    let res = await GET()
    let data = await res.json()
    expect(data.challenges[0].hint_image_url).toBeNull()

    mockPrisma.challenge.findMany.mockResolvedValueOnce([{
      ...BASE_CHALLENGE,
      hint_available_at: new Date(Date.now() - 5 * 60 * 1000),
    }])
    res = await GET()
    data = await res.json()
    expect(data.challenges[0].hint_image_url).toBe('https://blob.example/pista.png')
  })

  it('hint_text es null cuando hint_available_at es null (sin pista configurada)', async () => {
    mockPrisma.challenge.findMany.mockResolvedValue([{
      ...BASE_CHALLENGE,
      hint_available_at: null,
      hint_text: 'alguna pista',
    }])

    const res = await GET()
    const data = await res.json()

    expect(data.challenges[0].hint_text).toBeNull()
  })

  it('hint_enabled=true revela la pista aunque no haya fecha de desbloqueo', async () => {
    mockPrisma.challenge.findMany.mockResolvedValue([{
      ...BASE_CHALLENGE,
      hint_enabled: true,
      hint_available_at: null,
    }])

    const res = await GET()
    const data = await res.json()

    expect(data.challenges[0].hint_text).toBe('La pista secreta')
    expect(data.challenges[0].hint_image_url).toBe('https://blob.example/pista.png')
  })
})
