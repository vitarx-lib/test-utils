import {
  type Component,
  type ComponentProps,
  createComponentView,
  DOMRenderer,
  getRenderer,
  isPlainObject,
  setRenderer,
  type ValidProps
} from 'vitarx'
import type { MountOptions } from './types.js'
import { createContainer } from './utils.js'
import { type AppWrapper, Wrapper } from './wrapper.js'


/**
 * 挂载组件到测试环境
 * @param component 要挂载的组件函数或元素
 * @param options 挂载选项
 * @returns Wrapper 组件包装器
 */
export function mount<C extends Component>(
  component: C,
  options?: MountOptions<ComponentProps<C>>
): AppWrapper<C> {
  if (!getRenderer(true)) setRenderer(new DOMRenderer())
  const { props = {}, attachTo, domStubs } = options || {}
  // 创建组件视图并挂载到容器中
  const container = createContainer(attachTo)
  const view = createComponentView(component, props as ValidProps<C>).mount(container)
  // 应用 DOM 级别桩替换
  // 遍历 domStubs 对象中的每个选择器和对应的 HTML
  if (isPlainObject(domStubs)) {
    // 在容器中查找所有匹配选择器的元素
    for (const [selector, html] of Object.entries(domStubs)) {
      // 对每个匹配的节点进行处理
      const nodes = Array.from(container.querySelectorAll(selector))
      // 创建一个临时的占位元素，用于解析 HTML
      for (const node of nodes) {
        const placeholder = document.createElement('div')
        // 获取解析后的第一个子元素作为替换元素
        placeholder.innerHTML = html
        const replacement = placeholder.firstElementChild
        // 如果有有效的替换元素，则替换原始节点
        if (replacement) {
          node.replaceWith(replacement)
        } else {
          // 若传入的是纯文本或无包裹标签，则使用一个占位 div 包裹
          // 添加标记属性，表明这是一个桩替换元素
          const wrap = document.createElement('div')
          // 设置文本内容
          wrap.setAttribute('data-vx-stub', 'true')
          // 替换原始节点
          wrap.textContent = html
          node.replaceWith(wrap)
        }
      }
    }
    // 调用父类构造函数，传入创建的视图
  }
  return new Wrapper(view)
}
