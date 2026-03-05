/**
 * @fileoverview 组件挂载功能模块
 * @description 提供将 Vitarx 组件挂载到测试环境的核心功能
 * @module @vitarx/test-utils/mount
 */

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
 * 将组件挂载到测试环境
 * @description 创建一个组件实例并将其挂载到 DOM 中，返回一个包装器对象用于测试交互。
 *
 * 该函数执行以下操作：
 * 1. 初始化 DOM 渲染器（如果尚未初始化）
 * 2. 创建或使用提供的容器元素
 * 3. 创建组件视图并挂载到容器中
 * 4. 应用 DOM 级别的桩替换（如果配置了 domStubs）
 * 5. 返回包装器对象用于测试
 *
 * @template C - 组件类型，必须继承自 Component
 * @function mount
 * @param {C} component - 要挂载的组件函数或组件类
 * @param {MountOptions<ComponentProps<C>>} [options] - 挂载选项配置
 * @returns {AppWrapper<C>} 组件包装器实例，提供测试交互方法
 * @example
 * ```typescript
 * import { mount } from '@vitarx/test-utils'
 *
 * // 基本用法
 * function MyComponent(props: { message: string }) {
 *   return <div>{props.message}</div>
 * }
 *
 * const wrapper = mount(MyComponent, {
 *   props: { message: 'Hello World' }
 * })
 *
 * expect(wrapper.text()).toBe('Hello World')
 * wrapper.unmount()
 * ```
 *
 * @example
 * ```typescript
 * // 使用自定义容器
 * const container = document.createElement('div')
 * document.body.appendChild(container)
 *
 * const wrapper = mount(MyComponent, {
 *   attachTo: container
 * })
 * ```
 *
 * @example
 * ```typescript
 * // 使用 DOM 桩替换
 * const wrapper = mount(ParentComponent, {
 *   domStubs: {
 *     '.child-component': '<div class="mock-child">Mocked</div>'
 *   }
 * })
 * ```
 *
 * @see {@link MountOptions} 挂载选项接口
 * @see {@link Wrapper} 包装器类
 */
export function mount<C extends Component>(
  component: C,
  options?: MountOptions<ComponentProps<C>>
): AppWrapper<C> {
  if (!getRenderer(true)) setRenderer(new DOMRenderer())
  const { props = {}, attachTo, domStubs } = options || {}

  const container = createContainer(attachTo)
  const view = createComponentView(component, props as ValidProps<C>).mount(container)

  if (isPlainObject(domStubs)) {
    for (const [selector, html] of Object.entries(domStubs)) {
      const nodes = Array.from(container.querySelectorAll(selector))
      for (const node of nodes) {
        const placeholder = document.createElement('div')
        placeholder.innerHTML = html
        const replacement = placeholder.firstElementChild
        if (replacement) {
          node.replaceWith(replacement)
        } else {
          const wrap = document.createElement('div')
          wrap.setAttribute('data-vx-stub', 'true')
          wrap.textContent = html
          node.replaceWith(wrap)
        }
      }
    }
  }
  return new Wrapper(view)
}
