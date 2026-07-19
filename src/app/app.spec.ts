import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountApp } from '../test/renderApp'

describe('application foundation', () => {
  it('mounts the app on the overview route', async () => {
    const { wrapper } = await mountApp('/')
    await flushPromises()

    expect(wrapper.text()).toContain('Продолжение обучения')
    expect(wrapper.find('#main-content').exists()).toBe(true)
  })

  it('navigates through the main navigation', async () => {
    const { wrapper, router } = await mountApp('/')
    await flushPromises()

    const learnLink = wrapper.find('nav[aria-label="Основная навигация"] a[href="/learn"]')
    expect(learnLink.exists()).toBe(true)

    await router.push(learnLink.attributes('href') ?? '/learn')
    await flushPromises()
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/learn')
    expect(wrapper.text()).toContain('Карта курса')
  })

  it('renders desktop and mobile navigation regions', async () => {
    const { wrapper } = await mountApp('/')
    await flushPromises()

    expect(wrapper.find('nav[aria-label="Основная навигация"]').exists()).toBe(true)
    expect(wrapper.find('nav[aria-label="Мобильная навигация"]').exists()).toBe(true)
    expect(wrapper.findAll('a[href="/review"]').length).toBeGreaterThan(0)
  })

  it('switches theme from the top bar and persists it on the document', async () => {
    const { wrapper } = await mountApp('/')
    await flushPromises()

    const themeButton = wrapper.find('button[aria-label="Включить темную тему"]')
    expect(themeButton.exists()).toBe(true)

    await themeButton.trigger('click')
    await flushPromises()

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('renders the fallback route for unknown paths', async () => {
    const { wrapper, router } = await mountApp('/unknown/local/path')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('not-found')
    expect(wrapper.text()).toContain('Страница не найдена')
    expect(wrapper.text()).toContain('/unknown/local/path')
  })
})
