/**
 * @file 通用工具：nextTick、flushPromises、触发事件、设置值
 */

import { nextTick as vNextTick, type RuntimeElement } from 'vitarx'

/**
 * nextTick
 *
 * 等待框架在下一个微任务/渲染周期刷新视图。
 * - 适用于：同步状态已变更，但需要等待 DOM/渲染更新再进行断言。
 * - 对齐 Vitarx 的 nextTick 语义。
 */
export const nextTick = vNextTick

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
  await Promise.resolve()
  await vNextTick()
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
export async function tryTrigger(el: RuntimeElement, event: string, payload?: unknown): Promise<void> {
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
export async function setDomValue(el: HTMLElement, value: unknown): Promise<void> {
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
 * setValue
 *
 * 对外暴露的设置控件值的便捷方法，等价于调用 setDomValue。
 *
 * @param el 目标元素（input/textarea/select）
 * @param value 要设置的值
 * @returns Promise<void>
 */
export async function setValue(el: HTMLElement, value: unknown): Promise<void> {
  await setDomValue(el, value)
}
