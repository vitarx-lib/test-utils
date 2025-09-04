/**
 * @file spy 与 domStubs 用例
 */
import { describe, expect, it } from 'vitest'
import { createSpy, getCalls, mount } from '../src/index.js'

function Child() {
  return <div class="child">child</div>
}

function Parent() {
  return (
    <div>
      <Child class="child" />
    </div>
  )
}

describe('domStubs', () => {
  it('按选择器替换 DOM', async () => {
    const wrapper = mount(Parent, { domStubs: { '.child': '<div data-stub>stub</div>' } })
    expect(wrapper.html()).toContain('data-stub')
  })
})

describe('spy', () => {
  it('记录事件调用', async () => {
    const onClick = createSpy()
    const wrapper = mount(() => (
      <button
        class="btn"
        onClick={onClick}
      >
        OK
      </button>
    ))
    await wrapper.find('.btn')?.trigger('click')
    expect(getCalls(onClick).length).toBe(1)
  })
})
