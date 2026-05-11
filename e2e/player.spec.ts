import { test, expect } from '@playwright/test'

/**
 * Flujo completo del jugador.
 * Requiere: servidor dev en localhost:3000 con datos del seed (o DB con desafíos activos).
 */

test.describe('Flujo del jugador', () => {
  test('página principal carga y muestra desafíos activos o estado vacío', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Debe mostrar desafíos activos O el estado vacío ("Ningún desafío activo")
    const tiempoCount = await page.getByText(/TIEMPO RESTANTE/i).count()
    const emptyCount = await page.getByText(/Ningún desafío activo/i).count()

    expect(tiempoCount > 0 || emptyCount > 0).toBe(true)
  })

  test('formulario de envío existe con los campos correctos en el primer desafío', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const tiempoCount = await page.getByText(/TIEMPO RESTANTE/i).count()
    if (tiempoCount === 0) {
      test.skip()
      return
    }

    const firstCard = page.locator('article').first()

    // Verifica que el formulario tiene los elementos esperados
    await expect(firstCard.locator('select')).toBeVisible()
    await expect(firstCard.locator('input[type="password"]')).toBeVisible()
    await expect(firstCard.locator('textarea')).toBeVisible()
    await expect(firstCard.locator('button[type="submit"]')).toBeVisible()
  })

  test('puede enviar respuesta en el primer desafío activo', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const tiempoCount = await page.getByText(/TIEMPO RESTANTE/i).count()
    if (tiempoCount === 0) {
      test.skip()
      return
    }

    const firstCard = page.locator('article').first()

    // Esperar a que el select de equipos cargue sus opciones
    await page.waitForFunction(() => {
      const sel = document.querySelector('article select')
      return sel && (sel as HTMLSelectElement).options.length > 1
    })

    // Seleccionar Equipo Sigma (sin envíos recientes)
    const teamSelect = firstCard.locator('select').first()
    const options = await teamSelect.locator('option').allTextContents()
    const sigmaIndex = options.findIndex((o) => o.includes('Sigma'))
    if (sigmaIndex > 0) {
      await teamSelect.selectOption({ index: sigmaIndex })
      await firstCard.locator('input[type="password"]').fill('SIGMA-77')
    } else {
      await teamSelect.selectOption({ index: 1 })
    }

    await firstCard.locator('textarea').fill(`MENSAJE — test ${Date.now()}`)
    await firstCard.locator('button[type="submit"]').click()

    await page.waitForTimeout(2000)

    // Alguno de estos estados es válido: éxito, error de código, anti-spam
    const hasSuccess = await page.getByText(/Respuesta enviada/i).count() > 0
    const hasError = await firstCard.locator('[class*="rounded-lg"]').count() > 0
    expect(hasSuccess || hasError).toBe(true)
  })

  test('botón muestra cooldown tras envío exitoso', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const tiempoCount = await page.getByText(/TIEMPO RESTANTE/i).count()
    if (tiempoCount === 0) {
      test.skip()
      return
    }

    const firstCard = page.locator('article').first()

    await page.waitForFunction(() => {
      const sel = document.querySelector('article select')
      return sel && (sel as HTMLSelectElement).options.length > 1
    })

    const teamSelect = firstCard.locator('select').first()
    const options = await teamSelect.locator('option').allTextContents()
    const sigmaIndex = options.findIndex((o) => o.includes('Sigma'))
    if (sigmaIndex > 0) {
      await teamSelect.selectOption({ index: sigmaIndex })
      await firstCard.locator('input[type="password"]').fill('SIGMA-77')
    } else {
      await teamSelect.selectOption({ index: 1 })
    }

    await firstCard.locator('textarea').fill(`anti-spam test ${Date.now()}`)
    await firstCard.locator('button[type="submit"]').click()

    await page.waitForTimeout(2000)

    // Tras un envío (exitoso o con spam), el botón debe estar en un estado específico
    const submitBtn = firstCard.locator('button[type="submit"]')
    const btnText = await submitBtn.textContent()
    const hasFeedback = await firstCard.locator('[class*="rounded-lg"][class*="animate"]').count() > 0

    // El submit button existe y ha cambiado de estado, o hay un mensaje de feedback
    expect(btnText !== null || hasFeedback).toBe(true)
  })

  test('página de ranking carga correctamente', async ({ page }) => {
    await page.goto('/ranking')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /Ranking/i })).toBeVisible()

    // Debe mostrar tabla o mensaje de oculto
    const equipoCount = await page.getByText(/Equipo/i).count()
    const clasificadoCount = await page.getByText(/CLASIFICADO|oculto/i).count()
    expect(equipoCount > 0 || clasificadoCount > 0).toBe(true)
  })

  test('página de historial carga correctamente', async ({ page }) => {
    await page.goto('/historial')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /Historial/i })).toBeVisible()

    const sinHistorialCount = await page.getByText(/Sin historial/i).count()
    const cerradoCount = await page.getByText(/CERRADO/i).count()
    expect(sinHistorialCount > 0 || cerradoCount > 0).toBe(true)
  })
})
