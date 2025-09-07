import { defineProps, type Element, ref, Widget } from 'vitarx'
import { beforeEach, describe, expect, it } from 'vitest'
import { mount, nextTick } from '../src/index.js'

function Counter() {
  let count = ref(0)
  const onInc = () => (count.value += 1)
  return (
    <div>
      <span class="count">{count}</span>
      <button class="inc" onClick={onInc}>+</button>
    </div>
  )
}

class MockWidget extends Widget<{ count?: number }, { count: number }> {
  onCreate() {
    defineProps({ count: 1 })
  }

  build(): Element | null {
    return (
      <>
        <span class="count">{this.props.count}</span>
      </>
    )
  }
}

describe('核心能力：mount 与 DOM 交互', () => {
  describe('Counter 组件', () => {
    let wrapper: ReturnType<typeof mount>

    beforeEach(() => {
      wrapper = mount(Counter)
    })

    it('点击按钮触发更新', async () => {
      expect(wrapper.find('.count')?.text()).toBe('0')
      await wrapper.find('.inc')?.trigger('click')
      await nextTick()
      expect(wrapper.find('.count')?.text()).toBe('1')
    })

    it('渲染正确 HTML', () => {
      expect(wrapper.html())
        .toBe('<div><span class="count">0</span><button class="inc">+</button></div>')
    })

    it('find 查询单个元素', () => {
      expect(wrapper.find('.count')?.html())
        .toBe('<span class="count">0</span>')
    })

    it('findAll 查询多个元素', () => {
      expect(wrapper.findAll('.count')).toHaveLength(1)
    })

    it('组件卸载状态', () => {
      expect(wrapper.exists()).toBe(true)
      wrapper.unmount()
      expect(wrapper.exists()).toBe(false)
    })

    it('元素可见性', () => {
      const count = wrapper.find('.count')!
      expect(count.isVisible()).toBe(true)
      count.setProps({ style: { display: 'none' } })
      expect(count.isVisible()).toBe(false)
    })
  })

  describe('MockWidget 组件', () => {
    it('props 更新生效', async () => {
      const wrapper = mount(MockWidget)
      expect(wrapper.find('.count')?.text()).toBe('1')
      await wrapper.setProps({ count: 0 })
      await nextTick()
      expect(wrapper.find('.count')?.text()).toBe('0')
    })
  })
})
