import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  siteConfig: { findUnique: vi.fn() },
  team: { findMany: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { GET } from '@/app/api/ranking/route'

function makeTeam(id: string, name: string, pointLogs: Array<{ points: number; reason: string; challengeTitle?: string }>) {
  return {
    id,
    name,
    secret_code: 'secret',
    point_logs: pointLogs.map((l, i) => ({
      id: `pl-${id}-${i}`,
      team_id: id,
      points: l.points,
      reason: l.reason,
      challenge_id: l.challengeTitle ? `c-${i}` : null,
      challenge: l.challengeTitle ? { title: l.challengeTitle } : null,
      created_at: new Date(),
    })),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/ranking — Visibilidad', () => {
  it('devuelve { visible: false } cuando ranking_visible = "false"', async () => {
    mockPrisma.siteConfig.findUnique.mockResolvedValue({ id: '1', key: 'ranking_visible', value: 'false' })

    const res = await GET()
    const data = await res.json()

    expect(data.visible).toBe(false)
    expect(mockPrisma.team.findMany).not.toHaveBeenCalled()
  })

  it('devuelve { visible: false } cuando no existe la config', async () => {
    mockPrisma.siteConfig.findUnique.mockResolvedValue(null)

    const res = await GET()
    const data = await res.json()

    expect(data.visible).toBe(false)
  })

  it('devuelve datos cuando ranking_visible = "true"', async () => {
    mockPrisma.siteConfig.findUnique.mockResolvedValue({ id: '1', key: 'ranking_visible', value: 'true' })
    mockPrisma.team.findMany.mockResolvedValue([makeTeam('t1', 'Equipo Alfa', [{ points: 3, reason: '1er lugar', challengeTitle: 'Desafío 1' }])])

    const res = await GET()
    const data = await res.json()

    expect(data.visible).toBe(true)
    expect(Array.isArray(data.ranking)).toBe(true)
  })
})

describe('GET /api/ranking — Ordenación', () => {
  it('devuelve ranking ordenado descendente por total_points', async () => {
    mockPrisma.siteConfig.findUnique.mockResolvedValue({ id: '1', key: 'ranking_visible', value: 'true' })
    mockPrisma.team.findMany.mockResolvedValue([
      makeTeam('t1', 'Equipo Alfa', [
        { points: 3, reason: '1er lugar', challengeTitle: 'D1' },
        { points: 1, reason: 'Bonus' },
      ]),
      makeTeam('t2', 'Equipo Delta', [
        { points: 5, reason: '1er lugar', challengeTitle: 'D2' },
      ]),
    ])

    const res = await GET()
    const data = await res.json()

    expect(data.ranking[0].name).toBe('Equipo Delta')
    expect(data.ranking[0].total_points).toBe(5)
    expect(data.ranking[1].name).toBe('Equipo Alfa')
    expect(data.ranking[1].total_points).toBe(4)
  })

  it('suma correctamente múltiples PointLog del mismo equipo', async () => {
    mockPrisma.siteConfig.findUnique.mockResolvedValue({ id: '1', key: 'ranking_visible', value: 'true' })
    mockPrisma.team.findMany.mockResolvedValue([
      makeTeam('t1', 'Equipo Alfa', [
        { points: 3, reason: '1er lugar', challengeTitle: 'D1' },
        { points: 2, reason: '1er lugar', challengeTitle: 'D2' },
        { points: 1, reason: 'Bonus' },
      ]),
    ])

    const res = await GET()
    const data = await res.json()

    expect(data.ranking[0].total_points).toBe(6)
  })

  it('mantiene los dos equipos cuando hay empate', async () => {
    mockPrisma.siteConfig.findUnique.mockResolvedValue({ id: '1', key: 'ranking_visible', value: 'true' })
    mockPrisma.team.findMany.mockResolvedValue([
      makeTeam('t1', 'Equipo Alfa', [{ points: 3, reason: 'Test' }]),
      makeTeam('t2', 'Equipo Delta', [{ points: 3, reason: 'Test' }]),
    ])

    const res = await GET()
    const data = await res.json()

    expect(data.ranking).toHaveLength(2)
    expect(data.ranking[0].total_points).toBe(3)
    expect(data.ranking[1].total_points).toBe(3)
  })
})
