import { createComponentView, DOMRenderer, getRenderer, setRenderer } from 'vitarx'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createContainer,
  flushPromises,
  isHostElement,
  isHostFragment,
  setDomValue,
  toHtml,
  toText,
  tryTrigger
} from '../src/utils.js'

describe('utils.ts 工具函数测试', () => {
  beforeEach(() => {
    if (!getRenderer(true)) {
      setRenderer(new DOMRenderer())
    }
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('flushPromises', () => {
    it('应该返回一个 Promise', () => {
      const result = flushPromises()
      expect(result).toBeInstanceOf(Promise)
    })

    it('应该在微任务队列清空后 resolve', async () => {
      const order: string[] = []

      Promise.resolve().then(() => order.push('microtask 1'))
      order.push('sync')
      await flushPromises()
      order.push('after flush')

      expect(order).toEqual(['sync', 'microtask 1', 'after flush'])
    })

    it('应该能够处理多个微任务', async () => {
      let counter = 0

      Promise.resolve().then(() => counter++)
      Promise.resolve().then(() => counter++)
      Promise.resolve().then(() => counter++)

      await flushPromises()

      expect(counter).toBe(3)
    })

    it('应该能够处理嵌套的微任务', async () => {
      const order: string[] = []

      Promise.resolve().then(() => {
        order.push('outer')
        Promise.resolve().then(() => order.push('inner'))
      })

      await flushPromises()

      expect(order).toEqual(['outer', 'inner'])
    })
  })

  describe('tryTrigger', () => {
    it('应该在元素上触发事件', async () => {
      const div = document.createElement('div')
      const handler = vi.fn()
      div.addEventListener('click', handler)

      await tryTrigger(div, 'click')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('应该触发可冒泡的事件', async () => {
      const parent = document.createElement('div')
      const child = document.createElement('span')
      parent.appendChild(child)
      document.body.appendChild(parent)

      const parentHandler = vi.fn()
      parent.addEventListener('click', parentHandler)

      await tryTrigger(child, 'click')

      expect(parentHandler).toHaveBeenCalled()
    })

    it('应该触发可取消的事件', async () => {
      const div = document.createElement('div')

      div.addEventListener('click', (e) => {
        expect(e.cancelable).toBe(true)
      })

      await tryTrigger(div, 'click')
    })

    it('应该能够携带 payload 数据', async () => {
      const div = document.createElement('div')
      const payload = { message: 'test' }

      div.addEventListener('custom', ((e: Event) => {
        expect((e as any).detail).toEqual(payload)
      }) as EventListener)

      await tryTrigger(div, 'custom', payload)
    })

    it('应该支持不同类型的事件', async () => {
      const input = document.createElement('input')
      const inputHandler = vi.fn()
      const changeHandler = vi.fn()

      input.addEventListener('input', inputHandler)
      input.addEventListener('change', changeHandler)

      await tryTrigger(input, 'input')
      await tryTrigger(input, 'change')

      expect(inputHandler).toHaveBeenCalledTimes(1)
      expect(changeHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('setDomValue', () => {
    it('应该为 input 元素设置值', async () => {
      const input = document.createElement('input')
      input.type = 'text'

      await setDomValue(input, 'test value')

      expect(input.value).toBe('test value')
    })

    it('应该为 input 元素触发 input 和 change 事件', async () => {
      const input = document.createElement('input')
      const inputHandler = vi.fn()
      const changeHandler = vi.fn()

      input.addEventListener('input', inputHandler)
      input.addEventListener('change', changeHandler)

      await setDomValue(input, 'test')

      expect(inputHandler).toHaveBeenCalledTimes(1)
      expect(changeHandler).toHaveBeenCalledTimes(1)
    })

    it('应该为 textarea 元素设置值', async () => {
      const textarea = document.createElement('textarea')

      await setDomValue(textarea, 'textarea content')

      expect(textarea.value).toBe('textarea content')
    })

    it('应该为 select 元素设置选中值', async () => {
      const select = document.createElement('select')
      const option1 = document.createElement('option')
      option1.value = 'option1'
      const option2 = document.createElement('option')
      option2.value = 'option2'

      select.appendChild(option1)
      select.appendChild(option2)

      await setDomValue(select, 'option2')

      expect(option2.selected).toBe(true)
      expect(option1.selected).toBe(false)
    })

    it('应该为 select 元素触发 change 事件', async () => {
      const select = document.createElement('select')
      const option = document.createElement('option')
      option.value = 'test'
      select.appendChild(option)

      const changeHandler = vi.fn()
      select.addEventListener('change', changeHandler)

      await setDomValue(select, 'test')

      expect(changeHandler).toHaveBeenCalledTimes(1)
    })

    it('应该将 null 和 undefined 转换为空字符串', async () => {
      const input = document.createElement('input')

      await setDomValue(input, null)
      expect(input.value).toBe('')

      await setDomValue(input, undefined)
      expect(input.value).toBe('')
    })

    it('应该将数字转换为字符串', async () => {
      const input = document.createElement('input')

      await setDomValue(input, 123)

      expect(input.value).toBe('123')
    })

    it('应该在非 HTMLElement 上抛出错误', async () => {
      const textNode = document.createTextNode('test')

      await expect(setDomValue(textNode as any, 'value')).rejects.toThrow('setValue 仅支持 input/textarea/select 元素')
    })

    it('应该在不受支持的元素类型上抛出错误', async () => {
      const div = document.createElement('div')

      await expect(setDomValue(div, 'value')).rejects.toThrow('setValue 仅支持 input/textarea/select 元素')
    })
  })

  describe('isHostFragment', () => {
    it('应该对 DocumentFragment 返回 true', () => {
      const fragment = document.createDocumentFragment()
      expect(isHostFragment(fragment as any)).toBe(true)
    })

    it('应该对普通元素返回 false', () => {
      const div = document.createElement('div')
      expect(isHostFragment(div)).toBe(false)
    })

    it('应该对文本节点返回 false', () => {
      const text = document.createTextNode('test')
      expect(isHostFragment(text)).toBe(false)
    })
  })

  describe('isHostElement', () => {
    it('应该对 HTMLElement 返回 true', () => {
      const div = document.createElement('div')
      expect(isHostElement(div)).toBe(true)
    })

    it('应该对 DocumentFragment 返回 false', () => {
      const fragment = document.createDocumentFragment()
      expect(isHostElement(fragment as any)).toBe(false)
    })

    it('应该对文本节点返回 false', () => {
      const text = document.createTextNode('test')
      expect(isHostElement(text)).toBe(false)
    })
  })

  describe('toHtml', () => {
    it('应该返回元素的 outerHTML', () => {
      function TestComponent() {
        return <div class="test">content</div>
      }

      const view = createComponentView(TestComponent, {}).mount(document.body)
      const html = toHtml(view)

      expect(html).toContain('<div')
      expect(html).toContain('class="test"')
      expect(html).toContain('content')

      view.dispose()
    })

    it('应该处理嵌套元素', () => {
      function TestComponent() {
        return (
          <div>
            <span>child</span>
          </div>
        )
      }

      const view = createComponentView(TestComponent, {}).mount(document.body)
      const html = toHtml(view)

      expect(html).toContain('<div>')
      expect(html).toContain('<span>')
      expect(html).toContain('child')

      view.dispose()
    })
  })

  describe('toText', () => {
    it('应该返回元素的 textContent', () => {
      function TestComponent() {
        return <div>text content</div>
      }

      const view = createComponentView(TestComponent, {}).mount(document.body)
      const text = toText(view)

      expect(text).toBe('text content')

      view.dispose()
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

      const view = createComponentView(TestComponent, {}).mount(document.body)
      const text = toText(view)

      expect(text).toContain('text1')
      expect(text).toContain('text2')

      view.dispose()
    })
  })

  describe('createContainer', () => {
    it('应该创建新的容器元素', () => {
      const container = createContainer()

      expect(container).toBeInstanceOf(HTMLElement)
      expect(container.getAttribute('data-vx-test-container')).toBe('true')
      expect(document.body.contains(container)).toBe(true)
    })

    it('应该使用提供的容器', () => {
      const customContainer = document.createElement('div')
      customContainer.id = 'custom'

      const container = createContainer(customContainer)

      expect(container).toBe(customContainer)
      expect(container.id).toBe('custom')
    })

    it('应该在 attachTo 为 null 时创建新容器', () => {
      const container = createContainer(null)

      expect(container).toBeInstanceOf(HTMLElement)
      expect(container.getAttribute('data-vx-test-container')).toBe('true')
    })

    it('应该将容器添加到 document.body', () => {
      const container = createContainer()

      expect(document.body.contains(container)).toBe(true)
    })
  })
})
