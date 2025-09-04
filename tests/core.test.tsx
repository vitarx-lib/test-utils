/**
 * @file 核心能力用例：mount、setProps、find/trigger/html
 */
import { ref } from 'vitarx'
import { describe, expect, it } from 'vitest'
import { mount, nextTick } from '../src/index.js'

function Counter() {
  let count = ref(0)
  const onInc = () => (count.value += 1)
  return (
    <div>
      <span class="count">{count}</span>
      <button
        class="inc"
        onClick={onInc}
      >
        +
      </button>
    </div>
  )
}

describe('核心：mount 与 DOM 交互', () => {
  it('点击更新后，HTML 变化', async () => {
    const wrapper = mount(Counter)
    expect(wrapper.find('.count')?.html()).toBe('<span class="count">0</span>')
    await wrapper.find('.inc')?.trigger('click')
    await nextTick()
    expect(wrapper.find('.count')?.text()).toBe('1')
  })
})
