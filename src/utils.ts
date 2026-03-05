import { HostFragment, HostNode, nextTick, View } from 'vitarx'


const scheduler = typeof setImmediate === 'function' ? setImmediate : setTimeout

/**
 * flushPromises
 *
 * 清空当前事件循环中已排队的 Promise（微任务），随后再等待一帧渲染（nextTick）。
 * - 适用于：组件内部存在异步逻辑（如 Promise.then / async 函数），需确保这些异步完成并完成视图更新后再断言。
 * - 与 nextTick 的区别：nextTick 仅等待一帧渲染；flushPromises 先清空微任务队列，再触发渲染，适合“异步 → 更新视图”的场景。
 *
 * @returns Promise<void> 当所有已排队的 Promise 完成并完成一次 nextTick 后 resolve。
 */
export async function flushPromises(): Promise<void> {
  return new Promise((resolve) => {
    scheduler(resolve, 0)
  })
}

/**
 * tryTrigger
 *
 * 在指定元素上分发一个 DOM 事件，并等待一帧渲染（nextTick）。
 * - 事件为可冒泡、可取消的标准 Event；可通过 detail 携带附加数据。
 * - 典型用于：模拟 click/input/change 等交互事件。
 *
 * @param el 目标元素（必须是 HTMLElement）
 * @param event 事件名称，例如 'click' | 'input' | 'change'
 * @param payload 附加数据，会被放入 event.detail 中（若接收方读取）
 * @returns Promise<void> 分发完成且渲染完成后 resolve
 */
export async function tryTrigger(el: HostNode, event: string, payload?: unknown): Promise<void> {
  if (!('dispatchEvent' in el)) throw new Error('tryTrigger 仅支持 HTMLElement')
  const domEvent = new Event(event, { bubbles: true, cancelable: true })
  ;(domEvent as any).detail = payload
  el.dispatchEvent(domEvent)
  await nextTick()
}

/**
 * setDomValue
 *
 * 为可编辑表单控件设置值，并触发合适的 DOM 事件以驱动双向绑定或监听逻辑。
 * - 支持元素：input、textarea、select。
 * - input/textarea：设置 .value 后依次触发 'input' 与 'change'。
 * - select：根据传入值匹配 option.value，设置选中并触发 'change'。
 * - 不支持的元素将抛出异常，提示使用者更换选择器或方法。
 *
 * @param el 目标元素
 * @param value 要设置的值，将被转为字符串写入（select 用于匹配 option.value）
 * @returns Promise<void> 设置与事件触发完成后 resolve
 * @throws Error 当元素类型不受支持时抛出
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

export function isHostFragment(node: HostNode): node is HostFragment {
  return node instanceof DocumentFragment
}

export function isHostElement(node: HostNode): node is HTMLElement {
  return node instanceof Element
}


export function toHtml(view: View): string {
  const element = view.node
  // 检查元素是否支持outerHTML属性
  if (isHostElement(element)) return element.outerHTML
  if (isHostFragment(element)) {
    let html = ''
    for (const child of element.$view.children) {
      html += toHtml(child)
    }
    return html
  }
  // 如果不支持outerHTML，则返回元素的nodeValue或空字符串
  return element.nodeValue || ''
}

export function toText(view: View): string {
  const element = view.node
  // 检查元素是否支持outerHTML属性
  if (isHostElement(element)) return element.textContent
  if (isHostFragment(element)) {
    let text = ''
    for (const child of element.$view.children) {
      text += toText(child)
    }
    return text
  }
  // 如果不支持outerHTML，则返回元素的nodeValue或空字符串
  return element.nodeValue || ''
}

/**
 * 创建测试容器
 * @param attachTo 自定义容器，如果提供则使用，否则创建新容器
 * @returns HTMLElement 测试容器
 */
export function createContainer(attachTo?: Element | null): Element {
  if (attachTo) return attachTo
  const container = document.createElement('div')
  container.setAttribute('data-vx-test-container', 'true')
  document.body.appendChild(container)
  return container
}
