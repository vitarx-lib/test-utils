/**
 * @file 工具能力用例：nextTick、flushPromises、setValue
 */
import { ref } from 'vitarx'
import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '../src/index.js'

function Form() {
  let text = ref('')
  const onInput = (e: any) => (text.value = e.target.value)
  return (
    <div>
      <input
        class="ipt"
        value={text}
        onInput={onInput}
      />
      <span class="val">{text}</span>
    </div>
  )
}

describe('工具：setValue/flushPromises', () => {
  it('输入框赋值后，视图更新', async () => {
    const wrapper = mount(Form)
    const ipt = wrapper.find('.ipt')
    expect(ipt).not.toBeNull()
    await ipt!.setValue('hello')
    await flushPromises()
    expect(wrapper.find('.val')?.html()).toContain('hello')
  })
})
