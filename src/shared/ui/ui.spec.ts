import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppBadge from './AppBadge.vue'
import AppButton from './AppButton.vue'
import AppCard from './AppCard.vue'
import AppProgress from './AppProgress.vue'
import AppTabs from './AppTabs.vue'
import type { AppTab } from './types'

describe('shared ui components', () => {
  it('renders AppButton with disabled state', () => {
    const wrapper = mount(AppButton, {
      props: {
        disabled: true,
        variant: 'secondary',
      },
      slots: {
        default: 'Сохранить',
      },
    })

    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toBe('Сохранить')
  })

  it('renders AppProgress as an accessible progressbar', () => {
    const wrapper = mount(AppProgress, {
      props: {
        value: 40,
        label: 'Освоение',
      },
    })

    const progress = wrapper.get('[role="progressbar"]')
    expect(progress.attributes('aria-valuenow')).toBe('40')
    expect(progress.attributes('aria-label')).toBe('Освоение')
  })

  it('renders AppCard and AppBadge content', () => {
    const wrapper = mount({
      components: { AppBadge, AppCard },
      template: `
        <AppCard tone="review">
          <AppBadge tone="review">повторение</AppBadge>
          <p>Nullable-типы</p>
        </AppCard>
      `,
    })

    expect(wrapper.text()).toContain('повторение')
    expect(wrapper.text()).toContain('Nullable-типы')
  })

  it('emits tab updates from AppTabs', async () => {
    const tabs: readonly AppTab[] = [
      { value: 'one', label: 'Один' },
      { value: 'two', label: 'Два' },
    ]
    const wrapper = mount(AppTabs, {
      props: {
        tabs,
        modelValue: 'one',
      },
      slots: {
        one: '<p>Первый</p>',
        two: '<p>Второй</p>',
      },
    })

    await wrapper.findAll('button[role="tab"]')[1]?.trigger('mousedown', {
      button: 0,
      ctrlKey: false,
    })

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['two'])
  })
})
