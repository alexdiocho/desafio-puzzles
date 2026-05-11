import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  submission: { findMany: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { GET } from '@/app/api/challenges/[id]/activity/route'

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makeSub(teamName: string, createdAt: Date) {
  return { team: { name: teamName }, created_at: createdAt }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/challenges/[id]/activity — Feed de actividad', () => {
  it('devuelve team_name y created_at, nunca el campo answer', async () => {
    mockPrisma.submission.findMany.mockResolvedValue([
      makeSub('Equipo Alfa', new Date('2024-01-01T12:00:00Z')),
      makeSub('Equipo Delta', new Date('2024-01-01T11:00:00Z')),
    ])

    const req = new Request('http://localhost/api/challenges/c1/activity')
    const res = await GET(req, makeParams('c1'))
    const data = await res.json()

    expect(data.activity).toHaveLength(2)
    for (const entry of data.activity) {
      expect(entry).toHaveProperty('team_name')
      expect(entry).toHaveProperty('created_at')
      expect(entry).not.toHaveProperty('answer')
      expect(entry).not.toHaveProperty('team')
    }
  })

  it('solicita máximo 10 resultados a Prisma', async () => {
    mockPrisma.submission.findMany.mockResolvedValue([])

    const req = new Request('http://localhost/api/challenges/c1/activity')
    await GET(req, makeParams('c1'))

    expect(mockPrisma.submission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    )
  })

  it('solicita orden DESC por created_at', async () => {
    mockPrisma.submission.findMany.mockResolvedValue([])

    const req = new Request('http://localhost/api/challenges/c1/activity')
    await GET(req, makeParams('c1'))

    expect(mockPrisma.submission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'desc' } })
    )
  })

  it('filtra por challenge_id correcto', async () => {
    mockPrisma.submission.findMany.mockResolvedValue([])

    const req = new Request('http://localhost/api/challenges/challenge-xyz/activity')
    await GET(req, makeParams('challenge-xyz'))

    expect(mockPrisma.submission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { challenge_id: 'challenge-xyz' } })
    )
  })
})
