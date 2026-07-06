import {expect, test} from '@playwright/test'

// Skips the store's postal-code gate so product/checkout pages render directly.
const seedPostalCode = (page: import('@playwright/test').Page) =>
  page.addInitScript(() => {
    try {
      localStorage.setItem('df4y-store-delivery-postal-code-v1', '1000-001')
    } catch {
      /* storage may be unavailable */
    }
  })

test.describe('commerce + account flow', () => {
  test('add to cart → cart → checkout renders the order form', async ({page}) => {
    await seedPostalCode(page)
    await page.goto('/loja?lang=pt')

    await page.locator('a[href*="/loja/"]:visible').first().click()
    await expect(page).toHaveURL(/\/loja\/.+/)

    await page.getByRole('button', {name: /adicionar ao carrinho/i}).first().click()
    await expect(page.locator('.header-actions .cart-count')).toHaveText(/[1-9]/)

    await page.goto('/carrinho?lang=pt')
    await expect(page.locator('main')).not.toContainText('O carrinho está vazio')

    await page.goto('/finalizar-compra?lang=pt')
    await expect(page.locator('form input[name="email"]')).toBeVisible()
    await expect(page.locator('form input[name="deliveryAddress"]')).toBeVisible()
    await expect(page.locator('form input[name="csrfToken"]')).toHaveCount(1)
  })

  test('checkout shows the empty-cart state without items', async ({page}) => {
    await page.goto('/finalizar-compra?lang=pt')
    await expect(page.getByRole('heading', {name: 'O carrinho está vazio'})).toBeVisible()
  })

  test('/conta redirects to sign-in when unauthenticated', async ({page}) => {
    await page.goto('/conta?lang=pt')
    await expect(page).toHaveURL(/\/conta\/entrar/)
  })

  test('sign-in and register pages render their forms', async ({page}) => {
    await page.goto('/conta/entrar?lang=pt')
    await expect(page.locator('h1')).toContainText('Entrar')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()

    await page.goto('/conta/registar?lang=pt')
    await expect(page.locator('input[name="firstName"]')).toBeVisible()
    await expect(page.locator('input[name="lastName"]')).toBeVisible()
    await expect(page.locator('input[name="passwordConfirm"]')).toBeVisible()
  })

  test('unknown route serves the branded 404 page', async ({page}) => {
    const response = await page.goto('/pagina-que-nao-existe-xyz?lang=pt')
    expect(response?.status()).toBe(404)
    await expect(page.locator('h1')).toContainText('Página não encontrada')
  })
})
