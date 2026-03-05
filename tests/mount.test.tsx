import { getRenderer, ref, setRenderer } from 'vitarx'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '../src/mount.js'

describe('mount.ts 挂载函数测试', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('基本挂载功能', () => {
    it('应该成功挂载简单组件', () => {
      function SimpleComponent() {
        return <div>simple component</div>
      }

      const wrapper = mount(SimpleComponent)

      expect(wrapper).toBeDefined()
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toBe('simple component')

      wrapper.unmount()
    })

    it('应该返回 AppWrapper 实例', () => {
      function TestComponent() {
        return <div>test</div>
      }

      const wrapper = mount(TestComponent)

      expect(wrapper).toBeDefined()
      expect(wrapper.view).toBeDefined()
      expect(wrapper.html).toBeDefined()
      expect(wrapper.text).toBeDefined()

      wrapper.unmount()
    })

    it('应该将组件挂载到文档中', () => {
      function TestComponent() {
        return <div class="mounted">mounted</div>
      }

      const wrapper = mount(TestComponent)

      const mountedElement = document.querySelector('.mounted')
      expect(mountedElement).not.toBeNull()
      expect(mountedElement?.textContent).toBe('mounted')

      wrapper.unmount()
    })
  })

  describe('props 参数传递', () => {
    it('应该正确传递 props 到组件', () => {
      function PropsComponent(props: { message: string }) {
        return <div>{props.message}</div>
      }

      const wrapper = mount(PropsComponent, {
        props: { message: 'hello world' }
      })

      expect(wrapper.text()).toBe('hello world')

      wrapper.unmount()
    })

    it('应该支持多个 props', () => {
      function MultiPropsComponent(props: { title: string; count: number }) {
        return (
          <div>
            <span class="title">{props.title}</span>
            <span class="count">{props.count}</span>
          </div>
        )
      }

      const wrapper = mount(MultiPropsComponent, {
        props: { title: 'test', count: 42 }
      })

      expect(wrapper.find('.title')?.text()).toBe('test')
      expect(wrapper.find('.count')?.text()).toBe('42')

      wrapper.unmount()
    })

    it('应该处理空 props', () => {
      function NoPropsComponent() {
        return <div>no props</div>
      }

      const wrapper = mount(NoPropsComponent, { props: {} })

      expect(wrapper.text()).toBe('no props')

      wrapper.unmount()
    })

    it('应该处理未传递 props 选项', () => {
      function TestComponent() {
        return <div>test</div>
      }

      const wrapper = mount(TestComponent)

      expect(wrapper.text()).toBe('test')

      wrapper.unmount()
    })
  })

  describe('attachTo 自定义容器', () => {
    it('应该挂载到自定义容器', () => {
      const customContainer = document.createElement('div')
      customContainer.id = 'custom-container'
      document.body.appendChild(customContainer)

      function TestComponent() {
        return <div class="test">custom mount</div>
      }

      const wrapper = mount(TestComponent, {
        attachTo: customContainer
      })

      expect(customContainer.querySelector('.test')).not.toBeNull()
      expect(customContainer.textContent).toBe('custom mount')

      wrapper.unmount()
    })

    it('应该在未提供 attachTo 时创建默认容器', () => {
      function TestComponent() {
        return <div>default container</div>
      }

      const wrapper = mount(TestComponent)

      const containers = document.querySelectorAll('[data-vx-test-container]')
      expect(containers.length).toBeGreaterThan(0)

      wrapper.unmount()
    })
  })

  describe('domStubs DOM 桩替换', () => {
    it('应该替换匹配选择器的元素', () => {
      function TestComponent() {
        return (
          <div>
            <span class="replace">original</span>
          </div>
        )
      }

      const wrapper = mount(TestComponent, {
        domStubs: {
          '.replace': '<div class="stubbed">stubbed content</div>'
        }
      })

      const stubbed = document.querySelector('.stubbed')
      expect(stubbed).not.toBeNull()
      expect(stubbed?.textContent).toBe('stubbed content')

      const original = document.querySelector('.replace')
      expect(original).toBeNull()

      wrapper.unmount()
    })

    it('应该支持多个桩替换', () => {
      function TestComponent() {
        return (
          <div>
            <span class="stub1">original1</span>
            <span class="stub2">original2</span>
          </div>
        )
      }

      const wrapper = mount(TestComponent, {
        domStubs: {
          '.stub1': '<div class="replaced1">replaced1</div>',
          '.stub2': '<div class="replaced2">replaced2</div>'
        }
      })

      expect(document.querySelector('.replaced1')?.textContent).toBe('replaced1')
      expect(document.querySelector('.replaced2')?.textContent).toBe('replaced2')

      wrapper.unmount()
    })

    it('应该处理纯文本桩替换', () => {
      function TestComponent() {
        return <span class="text-stub">original</span>
      }

      const wrapper = mount(TestComponent, {
        domStubs: {
          '.text-stub': 'plain text'
        }
      })

      const stub = document.querySelector('[data-vx-stub]')
      expect(stub).not.toBeNull()
      expect(stub?.textContent).toBe('plain text')

      wrapper.unmount()
    })

    it('应该处理空 domStubs', () => {
      function TestComponent() {
        return <div>test</div>
      }

      const wrapper = mount(TestComponent, {
        domStubs: {}
      })

      expect(wrapper.text()).toBe('test')

      wrapper.unmount()
    })
  })

  describe('响应式组件挂载', () => {
    it('应该正确挂载响应式组件', () => {
      function ReactiveComponent() {
        const count = ref(0)
        return <div class="count">{count}</div>
      }

      const wrapper = mount(ReactiveComponent)

      expect(wrapper.find('.count')?.text()).toBe('0')

      wrapper.unmount()
    })

    it('应该支持响应式数据更新', async () => {
      function CounterComponent() {
        const count = ref(0)
        const increment = () => count.value++
        return (
          <div>
            <span class="count">{count}</span>
            <button class="increment" onClick={increment}>+</button>
          </div>
        )
      }

      const wrapper = mount(CounterComponent)

      expect(wrapper.find('.count')?.text()).toBe('0')

      await wrapper.find('.increment')?.trigger('click')

      expect(wrapper.find('.count')?.text()).toBe('1')

      wrapper.unmount()
    })
  })

  describe('嵌套组件挂载', () => {
    it('应该正确挂载嵌套组件', () => {
      function ChildComponent(props: { message: string }) {
        return <span class="child">{props.message}</span>
      }

      function ParentComponent() {
        return (
          <div class="parent">
            <ChildComponent message="child content" />
          </div>
        )
      }

      const wrapper = mount(ParentComponent)

      expect(wrapper.find('.parent')).not.toBeNull()
      expect(wrapper.find('.child')?.text()).toBe('child content')

      wrapper.unmount()
    })

    it('应该支持多层嵌套', () => {
      function DeepChild() {
        return <span class="deep">deep child</span>
      }

      function MiddleChild() {
        return (
          <div class="middle">
            <DeepChild />
          </div>
        )
      }

      function ParentComponent() {
        return (
          <div class="parent">
            <MiddleChild />
          </div>
        )
      }

      const wrapper = mount(ParentComponent)

      expect(wrapper.find('.deep')?.text()).toBe('deep child')

      wrapper.unmount()
    })
  })

  describe('边界条件', () => {
    it('应该处理空组件', () => {
      function EmptyComponent() {
        return <div></div>
      }

      const wrapper = mount(EmptyComponent)

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toBe('')

      wrapper.unmount()
    })

    it('应该处理包含多个根元素的组件', () => {
      function FragmentComponent() {
        return (
          <>
            <div class="first">first</div>
            <div class="second">second</div>
          </>
        )
      }

      const wrapper = mount(FragmentComponent)

      expect(wrapper.find('.first')).not.toBeNull()
      expect(wrapper.find('.second')).not.toBeNull()

      wrapper.unmount()
    })

    it('应该处理复杂的 JSX 结构', () => {
      function ComplexComponent() {
        return (
          <div class="container">
            <header>
              <h1>Title</h1>
            </header>
            <main>
              <section>
                <p>paragraph</p>
              </section>
            </main>
            <footer>
              <span>footer</span>
            </footer>
          </div>
        )
      }

      const wrapper = mount(ComplexComponent)

      expect(wrapper.find('h1')?.text()).toBe('Title')
      expect(wrapper.find('p')?.text()).toBe('paragraph')
      expect(wrapper.find('footer span')?.text()).toBe('footer')

      wrapper.unmount()
    })
  })

  describe('Renderer 初始化', () => {
    it('应该在 renderer 不存在时自动创建', () => {
      setRenderer(null as any)

      function TestComponent() {
        return <div>test</div>
      }

      const wrapper = mount(TestComponent)

      expect(getRenderer(true)).toBeDefined()
      expect(wrapper.text()).toBe('test')

      wrapper.unmount()
    })
  })
})
