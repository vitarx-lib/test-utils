import { ref } from 'vitarx'
import { flushPromises, mount } from '../src/index.js'

async function fetchData(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return 'loaded'
}

console.log('start')

function AsyncComponent() {
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

describe('异步组件', () => {
  it('加载数据', async () => {
    const wrapper = mount(AsyncComponent)
    await wrapper.find('.load')?.trigger('click')
    await flushPromises()
    await vi.waitFor(() => {
      expect(wrapper.find('.data')?.text()).toBe('loaded')
    })
  })
})
