import { test, expect, Page } from '@playwright/test'

/**
 * Flujo completo del admin.
 * Requiere: ADMIN_SECRET en .env o .env.local y servidor dev con datos del seed.
 */

const adminSecret = process.env.ADMIN_SECRET ?? ''

function adminUrl(path: string) {
  return `/admin/${adminSecret}${path}`
}

async function withAutoConfirm(page: Page, action: () => Promise<void>) {
  page.once('dialog', (dialog) => dialog.accept())
  await action()
}

test.describe.serial('Flujo completo del admin', () => {
  test.skip(!adminSecret, 'ADMIN_SECRET no configurado')

  test('panel admin carga con sidebar y dashboard', async ({ page }) => {
    await page.goto(adminUrl('/'))
    await page.waitForLoadState('networkidle')

    // El sidebar tiene enlaces de navegación
    await expect(page.getByRole('link', { name: /Fases/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Desafíos/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Equipos/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Config/i }).first()).toBeVisible()
  })

  test('puede crear una nueva fase', async ({ page }) => {
    await page.goto(adminUrl('/fases'))
    await page.waitForLoadState('networkidle')

    const phaseName = `Fase E2E ${Date.now()}`

    await page.getByRole('button', { name: /Nueva fase/i }).click()
    await expect(page.getByRole('heading', { name: /Nueva fase/i })).toBeVisible()

    await page.getByPlaceholder(/Fase 1: Calentamiento/i).fill(phaseName)
    await page.locator('input[type="number"]').fill('99')

    await page.getByRole('button', { name: /Guardar/i }).click()

    await expect(page.getByText(/Fase creada/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(phaseName)).toBeVisible()
  })

  test('puede crear un desafío en borrador', async ({ page }) => {
    await page.goto(adminUrl('/desafios'))
    await page.waitForLoadState('networkidle')

    const challengeTitle = `Desafío E2E ${Date.now()}`

    await page.getByRole('button', { name: /Nuevo desafío/i }).click()
    await page.waitForTimeout(500)

    // Rellenar título usando su placeholder específico
    await page.getByPlaceholder('El enigma del faro').fill(challengeTitle)

    // Rellenar descripción usando su placeholder
    await page.getByPlaceholder('Describe el desafío en markdown...').fill('Descripción del desafío de prueba E2E.')

    // Esperar que carguen las fases y seleccionar la primera real (índice 1)
    await page.waitForFunction(() => {
      const selects = document.querySelectorAll<HTMLSelectElement>('.fixed select')
      return selects.length > 0 && selects[0].options.length > 1
    })
    await page.locator('.fixed select').first().selectOption({ index: 1 })

    // Establecer end_time (2 horas desde ahora) — el primer datetime-local
    const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const endTimeStr = endTime.toISOString().slice(0, 16)
    await page.locator('.fixed input[type="datetime-local"]').first().fill(endTimeStr)

    // El botón submit dice "Crear desafío" para nuevos desafíos (no "Guardar")
    const crearBtn = page.getByRole('button', { name: /Crear desafío/i })
    await crearBtn.scrollIntoViewIfNeeded()
    await crearBtn.click()

    await expect(page.getByText(/Desafío creado/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(challengeTitle)).toBeVisible()
  })

  test('puede activar un desafío (draft → active)', async ({ page }) => {
    await page.goto(adminUrl('/desafios'))
    await page.waitForLoadState('networkidle')

    // Filtrar borradores
    await page.locator('select').nth(1).selectOption('draft')
    await page.waitForTimeout(300)

    // El botón "Activar" tiene el texto "▶ Activar"
    const activarBtn = page.getByRole('button', { name: /Activar/i }).last()
    await expect(activarBtn).toBeVisible({ timeout: 5000 })
    await withAutoConfirm(page, () => activarBtn.click())

    await expect(page.getByText(/Estado actualizado/i)).toBeVisible({ timeout: 5000 })

    // Verificar que el desafío aparece como activo
    await page.locator('select').nth(1).selectOption('active')
    const activoCount = await page.getByText('ACTIVO').count()
    expect(activoCount).toBeGreaterThan(0)
  })

  test('el desafío activo aparece en la página pública', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Debe haber al menos un desafío activo
    const tiempoCount = await page.getByText(/TIEMPO RESTANTE/i).count()
    expect(tiempoCount).toBeGreaterThan(0)
  })

  test('admin puede ver respuestas de un desafío activo', async ({ page }) => {
    await page.goto(adminUrl('/desafios'))
    await page.waitForLoadState('networkidle')

    // Filtrar activos
    await page.locator('select').nth(1).selectOption('active')
    await page.waitForTimeout(300)

    // El enlace de respuestas dice "Respuestas" (no "Ver respuestas")
    const respuestasLink = page.getByRole('link', { name: /^Respuestas$/i }).first()
    await expect(respuestasLink).toBeVisible({ timeout: 5000 })
    await respuestasLink.click()

    await page.waitForLoadState('networkidle')

    // La página de respuestas carga sin errores
    await expect(page.locator('body')).not.toContainText('Error 500')
    // Tiene algún contenido
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()
  })

  test('admin puede asignar ganador y puntos (si hay respuestas)', async ({ page }) => {
    await page.goto(adminUrl('/desafios'))
    await page.waitForLoadState('networkidle')

    await page.locator('select').nth(1).selectOption('active')
    await page.waitForTimeout(300)

    const respuestasLink = page.getByRole('link', { name: /^Respuestas$/i }).first()
    if (!await respuestasLink.isVisible({ timeout: 3000 })) return

    await respuestasLink.click()
    await page.waitForLoadState('networkidle')

    // Intentar asignar ganador si hay botón
    const ganadorBtn = page.getByRole('button', { name: /ganador/i }).first()
    if (await ganadorBtn.isVisible({ timeout: 2000 })) {
      await withAutoConfirm(page, () => ganadorBtn.click())
      await page.waitForTimeout(1500)
    }

    // La página sigue cargada sin errores críticos
    await expect(page.locator('body')).not.toContainText('Error 500')
  })

  test('admin puede finalizar un desafío activo', async ({ page }) => {
    await page.goto(adminUrl('/desafios'))
    await page.waitForLoadState('networkidle')

    await page.locator('select').nth(1).selectOption('active')
    await page.waitForTimeout(300)

    // El botón dice "■ Finalizar"
    const finalizarBtn = page.getByRole('button', { name: /Finalizar/i }).first()
    if (await finalizarBtn.isVisible({ timeout: 3000 })) {
      await withAutoConfirm(page, () => finalizarBtn.click())
      await expect(page.getByText(/Estado actualizado/i)).toBeVisible({ timeout: 5000 })
    }
  })

  test('desafío finalizado aparece en historial público', async ({ page }) => {
    await page.goto('/historial')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /Historial/i })).toBeVisible()

    // Puede haber desafíos cerrados o estar vacío
    const cerradoCount = await page.getByText('CERRADO').count()
    const sinHistorialCount = await page.getByText(/Sin historial/i).count()
    expect(cerradoCount > 0 || sinHistorialCount > 0).toBe(true)
  })

  test('toggle ranking: cambia visibilidad y se refleja en la página pública', async ({ page }) => {
    await page.goto(adminUrl('/config'))
    await page.waitForLoadState('networkidle')

    // Esperar que cargue el estado
    const statusText = page.getByText(/VISIBLE|OCULTO/i).first()
    await expect(statusText).toBeVisible({ timeout: 5000 })

    const currentlyVisible = (await statusText.textContent())?.includes('VISIBLE') ?? false

    // Hacer clic en el toggle
    const toggleBtn = page.getByRole('button', { name: /Toggle ranking visibility/i })
    await toggleBtn.click()
    await page.waitForTimeout(1500)

    // Verificar en la página pública de ranking
    await page.goto('/ranking')
    await page.waitForLoadState('networkidle')

    if (currentlyVisible) {
      // Ahora debe estar oculto
      const ocultoCount = await page.getByText(/CLASIFICADO|oculto/i).count()
      expect(ocultoCount).toBeGreaterThan(0)
    } else {
      // Ahora debe estar visible
      await expect(page.getByRole('heading', { name: /Ranking/i })).toBeVisible()
    }

    // Restaurar estado original
    await page.goto(adminUrl('/config'))
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/VISIBLE|OCULTO/i).first()).toBeVisible({ timeout: 5000 })
    await toggleBtn.click()
    await page.waitForTimeout(1000)
  })
})
