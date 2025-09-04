/**
 * @file 工具能力用例：nextTick、flushPromises、setValue
 */
import { describe, it, expect } from 'vitest'
import { mount, setValue, flushPromises } from '../src/index.js'

function Form() {
  let text = ''
  const onInput = (e: any) => (text = e.target.value)
  return (
    <div>
      <input
        class='ipt'
        value={text}
        onInput={onInput}
      />
      <span class='val'>{text}</span>
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
