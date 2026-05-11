import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  siteConfig: { findUnique: vi.fn(), upsert: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { checkAdminAuth } from '@/lib/admin'
import { GET, PUT } from '@/app/api/admin/config/ranking/route'

const ADMIN_SECRET = 'test-admin-secret-123'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.ADMIN_SECRET = ADMIN_SECRET
  mockPrisma.siteConfig.findUnique.mockResolvedValue({ id: '1', key: 'ranking_visible', value: 'true' })
  mockPrisma.siteConfig.upsert.mockResolvedValue({ id: '1', key: 'ranking_visible', value: 'true' })
})

describe('checkAdminAuth — función de validación', () => {
  it('devuelve 401 cuando no hay header x-admin-secret', () => {
    const req = new Request('http://localhost/api/admin/config/ranking')
    const result = checkAdminAuth(req)

    expect(result).not.toBeNull()
    expect(result!.status).toBe(401)
  })

  it('devuelve 401 con header x-admin-secret incorrecto', () => {
    const req = new Request('http://localhost/api/admin/config/ranking', {
      headers: { 'x-admin-secret': 'wrong-secret' },
    })
    const result = checkAdminAuth(req)

    expect(result).not.toBeNull()
    expect(result!.status).toBe(401)
  })

  it('devuelve null (autenticado) con header correcto', () => {
    const req = new Request('http://localhost/api/admin/config/ranking', {
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    const result = checkAdminAuth(req)

    expect(result).toBeNull()
  })
})

describe('GET /api/admin/config/ranking — integración auth', () => {
  it('devuelve 401 sin header', async () => {
    const req = new Request('http://localhost/api/admin/config/ranking')
    const res = await GET(req)

    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toMatch(/[Uu]nauthorized/)
  })

  it('devuelve 401 con header incorrecto', async () => {
    const req = new Request('http://localhost/api/admin/config/ranking', {
      headers: { 'x-admin-secret': 'bad-secret' },
    })
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('devuelve 200 con header correcto', async () => {
    const req = new Request('http://localhost/api/admin/config/ranking', {
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    const res = await GET(req)

    expect(res.status).toBe(200)
  })
})

describe('PUT /api/admin/config/ranking — integración auth', () => {
  it('devuelve 401 sin header en PUT', async () => {
    const req = new Request('http://localhost/api/admin/config/ranking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: true }),
    })
    const res = await PUT(req)

    expect(res.status).toBe(401)
  })

  it('permite PUT con header correcto', async () => {
    const req = new Request('http://localhost/api/admin/config/ranking', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': ADMIN_SECRET,
      },
      body: JSON.stringify({ visible: false }),
    })
    const res = await PUT(req)

    expect(res.status).toBe(200)
  })
})
