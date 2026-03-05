import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '../src/mount.js'
import { ref, DOMRenderer, getRenderer, setRenderer } from 'vitarx'

describe('wrapper.ts Wrapper 类测试', () => {
  beforeEach(() => {
    if (!getRenderer(true)) {
      setRenderer(new DOMRenderer())
    }
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('props 属性访问', () => {
    it('应该返回组件的 props', () => {
      function TestComponent(props: { message: string }) {
        return <div>{props.message}</div>
      }
      
      const wrapper = mount(TestComponent, {
        props: { message: 'test props' }
      })
      
      expect(wrapper.props).toEqual({ message: 'test props' })
      
      wrapper.unmount()
    })

    it('应该返回空对象当组件没有 props', () => {
      function NoPropsComponent() {
        return <div>no props</div>
      }
      
      const wrapper = mount(NoPropsComponent)
      
      expect(wrapper.props).toEqual({})
      
      wrapper.unmount()
    })

    it('props 应该是只读的', () => {
      function TestComponent(props: { value: number }) {
        return <div>{props.value}</div>
      }
      
      const wrapper = mount(TestComponent, {
        props: { value: 42 }
      })
      
      const props = wrapper.props
      expect(() => {
        (props as any).value = 100
      }).toThrow()
      
      wrapper.unmount()
    })
  })

  describe('view 属性访问', () => {
    it('应该返回视图实例', () => {
      function TestComponent() {
        return <div>test</div>
      }
      
      const wrapper = mount(TestComponent)
      
      expect(wrapper.view).toBeDefined()
      expect(wrapper.view.node).toBeDefined()
      
      wrapper.unmount()
    })
  })

  describe('attributes 方法', () => {
    it('应该返回所有属性当不传参数', () => {
      function TestComponent() {
        return <div id="test" class="container" data-value="123">test</div>
      }
      
      const wrapper = mount(TestComponent)
      const elementWrapper = wrapper.find('div')
      
      const attrs = elementWrapper?.attributes()
      
      expect(attrs).toMatchObject({
        id: 'test',
        class: 'container',
        'data-value': '123'
      })
      
      wrapper.unmount()
    })

    it('应该返回指定属性的值', () => {
      function TestComponent() {
        return <div id="test" data-value="123">test</div>
      }
      
      const wrapper = mount(TestComponent)
      const elementWrapper = wrapper.find('div')
      
      expect(elementWrapper?.attributes('id')).toBe('test')
      expect(elementWrapper?.attributes('data-value')).toBe('123')
      
      wrapper.unmount()
    })

    it('应该返回空字符串当属性不存在', () => {
      function TestComponent() {
        return <div>test</div>
      }
      
      const wrapper = mount(TestComponent)
      const elementWrapper = wrapper.find('div')
      
      expect(elementWrapper?.attributes('nonexistent')).toBe('')
      
      wrapper.unmount()
    })

    it('应该返回空对象当元素不支持属性', () => {
      function TestComponent() {
        return <>fragment content</>
      }
      
      const wrapper = mount(TestComponent)
      
      expect(wrapper.attributes()).toEqual({})
      
      wrapper.unmount()
    })
  })

  describe('classes 方法', () => {
    it('应该返回所有类名当不传参数', () => {
      function TestComponent() {
        return <div class="class1 class2 class3">test</div>
      }
      
      const wrapper = mount(TestComponent)
      const elementWrapper = wrapper.find('div')
      
      const classes = elementWrapper?.classes()
      
      expect(classes).toEqual(['class1', 'class2', 'class3'])
      
      wrapper.unmount()
    })

    it('应该检查类名是否存在', () => {
      function TestComponent() {
        return <div class="active visible">test</div>
      }
      
      const wrapper = mount(TestComponent)
      const elementWrapper = wrapper.find('div')
      
      expect(elementWrapper?.classes('active')).toBe(true)
      expect(elementWrapper?.classes('visible')).toBe(true)
      expect(elementWrapper?.classes('hidden')).toBe(false)
      
      wrapper.unmount()
    })

    it('应该返回空数组当元素没有类名', () => {
      function TestComponent() {
        return <div>test</div>
      }
      
      const wrapper = mount(TestComponent)
      const elementWrapper = wrapper.find('div')
      
      expect(elementWrapper?.classes()).toEqual([])
      
      wrapper.unmount()
    })

    it('应该返回 false 当元素不支持 classList', () => {
      function TestComponent() {
        return <>fragment</>
      }
      
      const wrapper = mount(TestComponent)
      
      expect(wrapper.classes('test')).toBe(false)
      
      wrapper.unmount()
    })
  })

  describe('exists 方法', () => {
    it('应该返回 true 当元素存在于文档中', () => {
      function TestComponent() {
        return <div>test</div>
      }
      
      const wrapper = mount(TestComponent)
      
      expect(wrapper.exists()).toBe(true)
      
      wrapper.unmount()
    })

    it('应该返回 false 当元素被移除', () => {
      function TestComponent() {
        return <div>test</div>
      }
      
      const wrapper = mount(TestComponent)
      wrapper.unmount()
      
      expect(wrapper.exists()).toBe(false)
    })
  })

  describe('isVisible 方法', () => {
    it('应该返回 true 当元素可见', () => {
      function TestComponent() {
        return <div>visible content</div>
      }
      
      const wrapper = mount(TestComponent)
      
      expect(wrapper.isVisible()).toBe(true)
      
      wrapper.unmount()
    })

    it('应该返回 false 当元素不存在', () => {
      function TestComponent() {
        return <div>test</div>
      }
      
      const wrapper = mount(TestComponent)
      wrapper.unmount()
      
      expect(wrapper.isVisible()).toBe(false)
    })

    it('应该返回 false 当 display 为 none', () => {
      function TestComponent() {
        return <div style="display: none;">hidden</div>
      }
      
      const wrapper = mount(TestComponent)
      
      expect(wrapper.isVisible()).toBe(false)
      
      wrapper.unmount()
    })

    it('应该返回 false 当 visibility 为 hidden', () => {
      function TestComponent() {
        return <div style="visibility: hidden;">hidden</div>
      }
      
      const wrapper = mount(TestComponent)
      
      expect(wrapper.isVisible()).toBe(false)
      
      wrapper.unmount()
    })
  })

  describe('find 方法', () => {
    it('应该找到匹配选择器的元素', () => {
      function TestComponent() {
        return (
          <div>
            <span class="target">found</span>
          </div>
        )
      }
      
      const wrapper = mount(TestComponent)
      const found = wrapper.find('.target')
      
      expect(found).not.toBeNull()
      expect(found?.text()).toBe('found')
      
      wrapper.unmount()
    })

    it('应该返回 null 当找不到元素', () => {
      function TestComponent() {
        return <div>no target</div>
      }
      
      const wrapper = mount(TestComponent)
      const found = wrapper.find('.nonexistent')
      
      expect(found).toBeNull()
      
      wrapper.unmount()
    })

    it('应该支持复杂选择器', () => {
      function TestComponent() {
        return (
          <div class="container">
            <div class="inner">
              <span class="deep">deep element</span>
            </div>
          </div>
        )
      }
      
      const wrapper = mount(TestComponent)
      const found = wrapper.find('.container .inner .deep')
      
      expect(found).not.toBeNull()
      expect(found?.text()).toBe('deep element')
      
      wrapper.unmount()
    })

    it('应该找到嵌套组件中的元素', () => {
      function ChildComponent() {
        return <span class="child">child element</span>
      }
      
      function ParentComponent() {
        return (
          <div>
            <ChildComponent />
          </div>
        )
      }
      
      const wrapper = mount(ParentComponent)
      const found = wrapper.find('.child')
      
      expect(found).not.toBeNull()
      expect(found?.text()).toBe('child element')
      
      wrapper.unmount()
    })
  })

  describe('findAll 方法', () => {
    it('应该找到所有匹配选择器的元素', () => {
      function TestComponent() {
        return (
          <div>
            <span class="item">item1</span>
            <span class="item">item2</span>
            <span class="item">item3</span>
          </div>
        )
      }
      
      const wrapper = mount(TestComponent)
      const items = wrapper.findAll('.item')
      
      expect(items).toHaveLength(3)
      expect(items[0].text()).toBe('item1')
      expect(items[1].text()).toBe('item2')
      expect(items[2].text()).toBe('item3')
      
      wrapper.unmount()
    })

    it('应该返回空数组当找不到元素', () => {
      function TestComponent() {
        return <div>no items</div>
      }
      
      const wrapper = mount(TestComponent)
      const items = wrapper.findAll('.nonexistent')
      
      expect(items).toEqual([])
      
      wrapper.unmount()
    })

    it('应该找到嵌套层级的所有元素', () => {
      function TestComponent() {
        return (
          <div>
            <div class="container">
              <span class="item">item1</span>
            </div>
            <div class="container">
              <span class="item">item2</span>
            </div>
          </div>
        )
      }
      
      const wrapper = mount(TestComponent)
      const items = wrapper.findAll('.item')
      
      expect(items).toHaveLength(2)
      
      wrapper.unmount()
    })
  })

  describe('trigger 方法', () => {
    it('应该触发点击事件', async () => {
      function TestComponent() {
        const clicked = ref(false)
        const handleClick = () => clicked.value = true
        
        return (
          <div>
            <button class="btn" onClick={handleClick}>
              {clicked.value ? 'clicked' : 'not clicked'}
            </button>
          </div>
        )
      }
      
      const wrapper = mount(TestComponent)
      const button = wrapper.find('.btn')
      
      await button?.trigger('click')
      
      expect(button?.text()).toBe('clicked')
      
      wrapper.unmount()
    })

    it('应该携带 payload 数据', async () => {
      function TestComponent() {
        const data = ref('')
        
        const handleCustom = (e: Event) => {
          data.value = (e as any).detail.message
        }
        
        return (
          <div>
            <button class="btn" onClick={handleCustom}>{data}</button>
          </div>
        )
      }
      
      const wrapper = mount(TestComponent)
      const button = wrapper.find('.btn')
      
      await button?.trigger('click', { message: 'custom data' })
      
      expect(button?.text()).toBe('custom data')
      
      wrapper.unmount()
    })

    it('应该触发自定义事件', async () => {
      const handler = vi.fn()
      
      function TestComponent() {
        return <div class="test">test</div>
      }
      
      const wrapper = mount(TestComponent)
      const div = wrapper.find('.test')
      
      div?.view.node.addEventListener('customEvent', handler)
      await div?.trigger('customEvent')
      
      expect(handler).toHaveBeenCalled()
      
      wrapper.unmount()
    })
  })

  describe('setValue 方法', () => {
    it('应该为 input 设置值', async () => {
      function TestComponent() {
        const value = ref('')
        
        return <input class="input" value={value} onInput={(e: any) => value.value = e.target.value} />
      }
      
      const wrapper = mount(TestComponent)
      const input = wrapper.find('.input')
      
      await input?.setValue('test value')
      
      const inputElement = input?.view.node as HTMLInputElement
      expect(inputElement.value).toBe('test value')
      
      wrapper.unmount()
    })

    it('应该为 textarea 设置值', async () => {
      function TestComponent() {
        return <textarea class="textarea"></textarea>
      }
      
      const wrapper = mount(TestComponent)
      const textarea = wrapper.find('.textarea')
      
      await textarea?.setValue('textarea content')
      
      const textareaElement = textarea?.view.node as HTMLTextAreaElement
      expect(textareaElement.value).toBe('textarea content')
      
      wrapper.unmount()
    })

    it('应该为 select 设置值', async () => {
      function TestComponent() {
        return (
          <select class="select">
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
          </select>
        )
      }
      
      const wrapper = mount(TestComponent)
      const select = wrapper.find('.select')
      
      await select?.setValue('option2')
      
      wrapper.unmount()
    })
  })

  describe('html 方法', () => {
    it('应该返回元素的 outerHTML', () => {
      function TestComponent() {
        return <div class="test">content</div>
      }
      
      const wrapper = mount(TestComponent)
      const html = wrapper.html()
      
      expect(html).toContain('<div')
      expect(html).toContain('class="test"')
      expect(html).toContain('content')
      
      wrapper.unmount()
    })

    it('应该包含子元素的 HTML', () => {
      function TestComponent() {
        return (
          <div class="parent">
            <span class="child">child content</span>
          </div>
        )
      }
      
      const wrapper = mount(TestComponent)
      const html = wrapper.html()
      
      expect(html).toContain('<span')
      expect(html).toContain('child content')
      
      wrapper.unmount()
    })
  })

  describe('text 方法', () => {
    it('应该返回元素的文本内容', () => {
      function TestComponent() {
        return <div>text content</div>
      }
      
      const wrapper = mount(TestComponent)
      const text = wrapper.text()
      
      expect(text).toBe('text content')
      
      wrapper.unmount()
    })

    it('应该包含所有子元素的文本', () => {
      function TestComponent() {
        return (
          <div>
            <span>text1</span>
            <span>text2</span>
          </div>
        )
      }
      
      const wrapper = mount(TestComponent)
      const text = wrapper.text()
      
      expect(text).toContain('text1')
      expect(text).toContain('text2')
      
      wrapper.unmount()
    })
  })

  describe('unmount 方法', () => {
    it('应该卸载组件', () => {
      function TestComponent() {
        return <div class="test">test</div>
      }
      
      const wrapper = mount(TestComponent)
      
      expect(wrapper.exists()).toBe(true)
      
      wrapper.unmount()
      
      expect(wrapper.exists()).toBe(false)
      expect(document.querySelector('.test')).toBeNull()
    })

    it('应该清理 DOM 元素', () => {
      function TestComponent() {
        return <div class="cleanup">should be removed</div>
      }
      
      const wrapper = mount(TestComponent)
      
      expect(document.querySelector('.cleanup')).not.toBeNull()
      
      wrapper.unmount()
      
      expect(document.querySelector('.cleanup')).toBeNull()
    })
  })

  describe('链式调用', () => {
    it('应该支持链式调用', async () => {
      function TestComponent() {
        const count = ref(0)
        return (
          <div class="container">
            <span class="count">{count}</span>
            <button class="increment" onClick={() => count.value++}>+</button>
          </div>
        )
      }
      
      const wrapper = mount(TestComponent)
      
      expect(wrapper.find('.count')?.text()).toBe('0')
      
      await wrapper.find('.increment')?.trigger('click')
      
      expect(wrapper.find('.count')?.text()).toBe('1')
      
      wrapper.unmount()
    })
  })
})
