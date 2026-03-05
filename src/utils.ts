/**
 * @fileoverview 测试工具辅助函数集合
 * @description 提供 DOM 操作、事件触发、值设置等测试辅助功能
 * @module @vitarx/test-utils/utils
 */

import { HostFragment, HostNode, nextTick, View } from 'vitarx'

/**
 * 任务调度器
 * @description 根据环境选择合适的异步调度方法，优先使用 setImmediate（Node.js），降级使用 setTimeout
 * @type {Function}
 * @private
 */
const scheduler = typeof setImmediate === 'function' ? setImmediate : setTimeout

/**
 * 清空当前事件循环中的 Promise 微任务队列
 * @description 清空当前事件循环中已排队的 Promise（微任务），随后再等待一帧渲染（nextTick）。
 * 适用于组件内部存在异步逻辑（如 Promise.then / async 函数），需确保这些异步完成并完成视图更新后再断言。
 *
 * 与 nextTick 的区别：
 * - nextTick 仅等待一帧渲染
 * - flushPromises 先清空微任务队列，再触发渲染，适合"异步 → 更新视图"的场景
 *
 * @async
 * @function flushPromises
 * @returns {Promise<void>} 当所有已排队的 Promise 完成并完成一次 nextTick 后 resolve
 * @example
 * ```typescript
 * // 等待异步操作完成
 * async function testAsyncComponent() {
 *   const wrapper = mount(AsyncComponent)
 *   wrapper.find('button')?.trigger('click')
 *   await flushPromises() // 等待所有 Promise 完成
 *   expect(wrapper.text()).toBe('loaded')
 * }
 * ```
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop|Event Loop}
 */
export async function flushPromises(): Promise<void> {
  return new Promise(resolve => {
    scheduler(resolve, 0)
  })
}

/**
 * 在指定元素上触发 DOM 事件
 * @description 在指定元素上分发一个 DOM 事件，并等待一帧渲染（nextTick）。
 * 事件为可冒泡、可取消的标准 Event；可通过 detail 携带附加数据。
 * 典型用于模拟 click/input/change 等交互事件。
 *
 * @async
 * @function tryTrigger
 * @param {HostNode} el - 目标元素（必须是支持 dispatchEvent 的 HTMLElement）
 * @param {string} event - 事件名称，例如 'click'、'input'、'change'、'custom'
 * @param {unknown} [payload] - 可选的附加数据，会被放入 event.detail 中供事件监听器读取
 * @returns {Promise<void>} 分发完成且渲染完成后 resolve
 * @throws {Error} 当元素不支持 dispatchEvent 方法时抛出错误
 * @example
 * ```typescript
 * // 触发点击事件
 * await tryTrigger(button, 'click')
 *
 * // 触发自定义事件并携带数据
 * await tryTrigger(element, 'custom', { message: 'test' })
 * ```
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent|dispatchEvent}
 */
export async function tryTrigger(el: HostNode, event: string, payload?: unknown): Promise<void> {
  if (!('dispatchEvent' in el)) throw new Error('tryTrigger: dispatchEvent not supported')
  const domEvent = new Event(event, { bubbles: true, cancelable: true })
  ;(domEvent as any).detail = payload
  el.dispatchEvent(domEvent)
  await nextTick()
}

/**
 * 为表单控件设置值并触发相应事件
 * @description 为可编辑表单控件设置值，并触发合适的 DOM 事件以驱动双向绑定或监听逻辑。
 *
 * 支持的元素类型：
 * - input：设置 .value 后依次触发 'input' 与 'change' 事件
 * - textarea：设置 .value 后依次触发 'input' 与 'change' 事件
 * - select：根据传入值匹配 option.value，设置选中状态并触发 'change' 事件
 *
 * @async
 * @function setDomValue
 * @param {HostNode} el - 目标表单元素
 * @param {unknown} value - 要设置的值，将被转为字符串写入（select 用于匹配 option.value）
 * @returns {Promise<void>} 设置与事件触发完成后 resolve
 * @throws {Error} 当元素不是 HTMLElement 时抛出错误
 * @throws {Error} 当元素类型不是 input/textarea/select 时抛出错误
 * @example
 * ```typescript
 * // 设置 input 值
 * const input = wrapper.find('input')
 * await setDomValue(input.view.node, 'new value')
 *
 * // 设置 select 值
 * const select = wrapper.find('select')
 * await setDomValue(select.view.node, 'option2')
 * ```
 */
export async function setDomValue(el: HostNode, value: unknown): Promise<void> {
  if (!(el instanceof HTMLElement)) throw new Error('setValue 仅支持 input/textarea/select 元素')
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea') {
    ;(el as HTMLInputElement | HTMLTextAreaElement).value = String(value ?? '')
    await tryTrigger(el, 'input')
    await tryTrigger(el, 'change')
    return
  }
  if (tag === 'select') {
    const select = el as HTMLSelectElement
    const str = String(value ?? '')
    for (const option of Array.from(select.options)) {
      option.selected = option.value === str
    }
    await tryTrigger(el, 'change')
    return
  }
  throw new Error('setValue 仅支持 input/textarea/select 元素')
}

/**
 * 检查节点是否为 DocumentFragment 类型
 * @description 类型守卫函数，用于判断给定的节点是否为 DocumentFragment 实例
 * @function isHostFragment
 * @param {HostNode} node - 要检查的节点
 * @returns {boolean} 如果是 DocumentFragment 返回 true，否则返回 false
 * @example
 * ```typescript
 * if (isHostFragment(node)) {
 *   // TypeScript 知道 node 是 DocumentFragment 类型
 *   console.log(node.$startAnchor)
 * }
 * ```
 */
export function isHostFragment(node: HostNode): node is HostFragment {
  return node instanceof DocumentFragment
}

/**
 * 检查节点是否为 Element 类型
 * @description 类型守卫函数，用于判断给定的节点是否为 Element（HTMLElement）实例
 * @function isHostElement
 * @param {HostNode} node - 要检查的节点
 * @returns {boolean} 如果是 Element 返回 true，否则返回 false
 * @example
 * ```typescript
 * if (isHostElement(node)) {
 *   // TypeScript 知道 node 是 HTMLElement 类型
 *   console.log(node.getAttribute('class'))
 * }
 * ```
 */
export function isHostElement(node: HostNode): node is HTMLElement {
  return node instanceof Element
}

/**
 * 将视图转换为 HTML 字符串
 * @description 递归遍历视图树，生成对应的 HTML 字符串表示。
 * 支持处理 Element、DocumentFragment 和文本节点。
 *
 * @function toHtml
 * @param {View} view - 要转换的视图对象
 * @returns {string} 视图的 HTML 字符串表示
 * @example
 * ```typescript
 * const wrapper = mount(MyComponent)
 * const html = toHtml(wrapper.view)
 * console.log(html) // '<div class="my-component">...</div>'
 * ```
 */
export function toHtml(view: View): string {
  const element = view.node
  if (isHostElement(element)) return element.outerHTML
  if (isHostFragment(element)) {
    let html = ''
    for (const child of element.$view.children) {
      html += toHtml(child)
    }
    return html
  }
  return element.nodeValue || ''
}

/**
 * 提取视图的文本内容
 * @description 递归遍历视图树，提取所有文本节点的文本内容。
 * 支持处理 Element、DocumentFragment 和文本节点。
 *
 * @function toText
 * @param {View} view - 要提取文本的视图对象
 * @returns {string} 视图的文本内容字符串
 * @example
 * ```typescript
 * const wrapper = mount(MyComponent)
 * const text = toText(wrapper.view)
 * console.log(text) // 'Hello World'
 * ```
 */
export function toText(view: View): string {
  const element = view.node
  if (isHostElement(element)) return element.textContent
  if (isHostFragment(element)) {
    let text = ''
    for (const child of element.$view.children) {
      text += toText(child)
    }
    return text
  }
  return element.nodeValue || ''
}

/**
 * 创建测试容器元素
 * @description 创建用于挂载测试组件的容器元素。如果提供了自定义容器则直接使用，
 * 否则创建一个新的 div 元素并添加到 document.body。
 *
 * @function createContainer
 * @param {Element | null} [attachTo] - 可选的自定义容器元素
 * @returns {Element} 测试容器元素
 * @example
 * ```typescript
 * // 使用自动创建的容器
 * const container = createContainer()
 * // container 已添加到 document.body 并带有 data-vx-test-container 属性
 *
 * // 使用自定义容器
 * const customContainer = document.getElementById('test')
 * const container = createContainer(customContainer)
 * // container === customContainer
 * ```
 */
export function createContainer(attachTo?: Element | null): Element {
  if (attachTo) return attachTo
  const container = document.createElement('div')
  container.setAttribute('data-vx-test-container', 'true')
  document.body.appendChild(container)
  return container
}
