import { ref } from 'vitarx'
import { expect } from 'vitest'
import { mount } from '../src/index.js'

async function fetchData(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return 'loaded'
}

function AsyncLoad() {
  const data = ref('')
  const loadData = async () => {
    data.value = await fetchData()
  }
  return (
    <div>
      <span class="data">{data}</span>
      <button class="load" onClick={loadData}>Load</button>
    </div>
  )
}

describe('异步加载', () => {
  test('模拟点击加载按钮', async () => {
    const wrapper = mount(AsyncLoad)
    const buttonWrapper = wrapper.find('.load')!
    expect(buttonWrapper).not.toBeNull()
    await buttonWrapper.trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.find('.data')?.text()).toBe('loaded')
    })
  })
})
