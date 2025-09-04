/**
 * @file 提供 mount API
 */

import {
  ContainerVNode,
  createVNode,
  type ElementVNode,
  type IntrinsicNodeElementName,
  NoTagVNode,
  type RuntimeElement,
  type VNode,
  type VNodeInstance,
  type VNodeProps,
  VNodeUpdate,
  type WidgetInstance,
  type WidgetType,
  WidgetVNode
} from 'vitarx'
import { createTestingApp } from './testingApp.js'
import type { MountOptions } from './types.js'
import { setDomValue, tryTrigger } from './utils.js'

/**
 * 创建测试容器
 * @param attachTo 自定义容器，如果提供则使用，否则创建新容器
 * @returns HTMLElement 测试容器
 */
function createContainer(attachTo?: HTMLElement | null): HTMLElement {
  if (attachTo) return attachTo
  const container = document.createElement('div')
  container.setAttribute('data-vitarx-test-container', 'true')
  document.body.appendChild(container)
  return container
}

/**
 * 创建组件包装器
 * @param component 组件函数或元素
 * @param options 挂载选项
 * @returns Wrapper 包装器实例
 */
function createWrapper<C extends WidgetType>(
  component: C,  // 组件函数或组件元素
  options: MountOptions<VNodeProps<C>>  // 挂载配置选项
): Wrapper<VNodeInstance<C>> {
  // 创建测试应用实例
  const app = createTestingApp()
  // 创建容器元素
  const container = createContainer(options.attachTo)
  // 当前组件属性
  const currentProps: VNodeProps<C> = options.props ?? {} as VNodeProps<C>
  // 挂载组件
  const node = app.mount(component, currentProps, container, options.domStubs) as VNodeInstance<C>
  // 返回包装器实例
  return new Wrapper(node)
}

/**
 * 挂载组件到测试环境
 * @param component 要挂载的组件函数或元素
 * @param options 挂载选项
 * @returns Wrapper 组件包装器
 */
export function mount<C extends WidgetType>(
  component: C,
  options: MountOptions<VNodeProps<C>> = {}
): Wrapper<VNodeInstance<C>> {
  const { props = {} as VNodeProps<C> } = options
  return createWrapper(component, { ...options, props })
}

/**
 * DOM节点包装器
 * 提供对虚拟节点(VNode)的便捷操作接口，封装了节点的常用操作方法，包括属性访问、DOM操作、事件触发等功能。
 *
 * 核心功能：
 * - 节点属性访问和修改（props）
 * - DOM元素操作（element访问、查找、可见性检查）
 * - 事件触发（trigger）
 * - 值的设置和获取（setValue）
 * - 内容获取（html、text）
 * - 组件生命周期管理（unmount）
 *
 * @example
 *
 * // 创建包装器实例
 * const wrapper = new Wrapper(vnode);
 *
 * // 访问属性
 * console.log(wrapper.props);
 *
 * // 查找子元素
 * const child = wrapper.find('.child-class');
 *
 * // 触发事件
 * await wrapper.trigger('click');
 *
 * @template T 节点类型，必须继承自VNode
 * @param {T} node - 要包装的虚拟节点(VNode)实例
 */
export class Wrapper<T extends VNode> {
  // 使用私有字段存储节点，确保封装性
  readonly #node: T

  /**
   * 构造函数，用于初始化组件实例
   * @param node - 要挂载的组件节点，类型为泛型T
   */
  constructor(node: T) {
    this.#node = node  // 挂载组件
  }

  /**
   * 获取节点的属性，并返回一个冻结的对象
   * 冻结的对象意味着不能被修改，确保属性的不可变性
   *
   * @returns {Object} - 返回一个包含节点属性的冻结对象
   */
  get props(): Readonly<T['props']> {
    return Object.freeze(this.#node.props)  // 使用Object.freeze方法冻结节点属性对象，确保其不可变性
  }

  /**
   * 获取当前节点的运行时元素
   * 这是一个 getter 属性，用于返回与当前节点关联的运行时元素
   *
   * @returns {RuntimeElement<T['type']>} 返回与当前节点关联的运行时元素，其类型由泛型 T 的 type 属性决定
   */
  get element(): RuntimeElement<T['type']> {
    // 返回内部节点的元素，并确保其类型符合 RuntimeElement<T['type']>
    return this.#node.element as RuntimeElement<T['type']>
  }

  /**
   * 获取虚拟节点的方法
   * 提供对底层虚拟节点的直接访问
   */
  get node(): T {
    return this.#node
  }

  /**
   * 设置组件的新属性并更新虚拟节点
   * 该方法会合并新旧属性，并触发组件的重新渲染
   *
   * @param nextProps - 部分更新的属性对象
   * @returns {Promise<void>} 返回一个解析为undefined的Promise，表示更新操作完成
   */
  setProps(nextProps: Partial<any>): Promise<void> {
    // 合并当前属性和新属性，创建新的属性对象
    const newProps = { ...this.props, ...nextProps }
    // 使用新的属性创建新的虚拟节点
    const node = createVNode(this.#node.type, newProps)
    // 执行属性更新操作，将新旧节点的属性差异进行应用
    VNodeUpdate.patchUpdateAttrs(this.#node, node as unknown as T)
    // 返回一个已解析的Promise，表示操作完成
    return Promise.resolve(void 0)
  }

  /**
   * 获取组件实例的方法
   * 根据当前节点的类型返回对应的组件实例
   * 使用条件类型和类型推断来确定返回类型
   *
   * @returns {Object|null} 如果节点是 WidgetVNode 类型，返回对应的 WidgetInstance<C>，否则返回 null
   */
  getWidgetInstance(): T extends WidgetVNode<infer C> ? WidgetInstance<C> : null {
    // 检查当前节点是否是 WidgetVNode 的实例
    if (WidgetVNode.is(this.#node)) return this.#node.instance as any
    // 如果不是 WidgetVNode 实例，则返回 null
    return null as any
  }

  /**
   * 检查当前节点是否存在
   * 通过检查节点的父节点是否存在来判断
   *
   * @returns {boolean} - 如果节点的父节点不为null，则返回true，表示节点存在；否则返回false
   */
  exists(): boolean {
    return this.#node.element.parentNode !== null
  }

  /**
   * 检查元素是否可见
   * 通过多种CSS属性和DOM状态来判断元素的可见性
   *
   * @returns {boolean} 如果元素可见则返回true，否则返回false
   */
  isVisible(): boolean {
    if (this.element instanceof HTMLElement) {
      // 检查元素是否在DOM中存在且可见
      // 1. 元素必须存在于文档中
      if (!this.exists()) return false

      // 2. 检查元素的display属性是否为'none'
      const computedStyle = window.getComputedStyle(this.element)
      if (computedStyle.display === 'none') return false

      // 3. 检查元素的visibility属性是否为'hidden'
      if (computedStyle.visibility === 'hidden') return false

      // 4. 检查元素的opacity是否为'0'
      if (computedStyle.opacity === '0') return false

      // 5. 检查元素或其任何父元素是否通过display样式属性隐藏
      // offsetParent为null表示元素或其父元素被隐藏（除了position为fixed的情况）
      if (this.element.offsetParent === null && computedStyle.position !== 'fixed') return false

      // 6. 检查元素的尺寸
      const rect = this.element.getBoundingClientRect()
      return !(rect.width === 0 && rect.height === 0)
    }
    // 对于非HTMLElement元素，如果存在则认为可见
    return this.exists()
  }

  /**
   * 查找匹配元素选择器的所有元素节点
   * 支持通过标签名或CSS选择器查找子元素
   *
   * @example
   * // 查找所有div元素
   * wrapper.findAll('div')
   *
   * @template T - 元素标签类型
   * @param selector - 要查找的DOM元素标签或CSS选择器
   * @returns {Array<ElementVNode>} 返回一个包装后的数组，每个元素都是ElementVNode<T>类型的Wrapper实例
   */
  findAll<T extends IntrinsicNodeElementName>(selector: T): Wrapper<ElementVNode<T>>[]
  /**
   * 查找匹配选择器的所有元素节点
   *
   * @param selector - CSS选择器字符串
   * @returns {Array<ElementVNode>} 返回匹配选择器的Wrapper数组，如果没有匹配项则返回空数组
   */
  findAll(selector: string): Wrapper<ElementVNode>[] {
    // 检查当前节点是否具有querySelectorAll方法
    if (!('querySelectorAll' in this.#node.element)) return []

    // 使用选择器查找所有匹配的DOM元素
    const elements = Array.from((this.#node.element as HTMLElement).querySelectorAll(selector))
    // 如果没有匹配的元素，直接返回空数组
    if (elements.length === 0) return []

    // 用于存储匹配的包装器对象数组
    const wrappers: Wrapper<ElementVNode>[] = []
    // 获取当前节点的元素节点
    const node = this.#findElementNode(this.#node)

    // 定义访问子节点的函数
    const visit = (child: VNode) => {
      // 获取子节点的元素节点
      const elNode = this.#findElementNode(child)
      // 如果子节点的元素存在于匹配的元素集合中，则创建包装器并添加到结果数组
      if (elNode.element && elements.includes(elNode.element as HTMLElement)) {
        wrappers.push(new Wrapper(elNode as ElementVNode))
      }
      // 如果是容器节点，递归访问其子节点
      if (ContainerVNode.is(elNode)) {
        elNode.children.forEach(visit)
      }
    }

    // 如果是容器节点，开始遍历其子节点
    if (ContainerVNode.is(node)) {
      node.children.forEach(visit)
    }

    return wrappers
  }

  /**
   * 根据选择器查找匹配的DOM元素并返回其包装器对象
   * 实现深度优先搜索来查找匹配的元素
   *
   * @param selector - 用于查找DOM元素的CSS选择器
   * @returns {Wrapper<ElementVNode>} 返回匹配元素的Wrapper包装器对象，如果未找到则返回null
   */
  find(selector: string): Wrapper<ElementVNode> | null {
    // 使用选择器查找匹配的DOM元素
    const element = (this.#node.element as HTMLElement).querySelector(selector)
    // 如果没有匹配的元素，则返回null
    if (!element) return null

    // 定义访问子节点的函数
    const visit = (child: VNode): ElementVNode | null => {
      // 获取子节点的元素节点
      const elNode = this.#findElementNode(child)
      // 如果子节点的元素等于匹配的元素，则返回包装器对象
      if (elNode.element === element) return elNode as ElementVNode
      if (ContainerVNode.is(elNode)) {
        for (const child of elNode.children) {
          const node = visit(child)
          if (node?.element === element) return node
        }
      }
      return null
    }

    const v = visit(this.#node)
    return v ? new Wrapper(v) : null
  }

  /**
   * 触发一个事件，并传递可选的负载数据
   * 模拟DOM事件触发，支持自定义事件数据
   *
   * @param event 事件名称，例如 'click' | 'input' | 'change'
   * @param payload 附加数据，会被放入 event.detail 中（若接收方读取）
   * @returns {Promise<void>} 一个Promise，解析为undefined，表示事件触发操作完成
   */
  trigger(event: string, payload?: unknown): Promise<void> {
    return tryTrigger(this.element, event, payload)
  }

  /**
   * 设置值的异步方法
   * 支持对NoTagVNode和普通DOM元素设置值
   *
   * @param value - 要设置的值，类型为未知类型
   * @returns 返回一个Promise，解析为void类型
   */
  setValue(value: unknown): Promise<void> {
    // 检查当前节点是否为NoTagVNode类型
    if (NoTagVNode.is(this.#node)) {
      // 如果是NoTagVNode，直接设置其value属性
      this.#node.value = String(value ?? '')
      // 返回一个已解析的Promise
      return Promise.resolve(void 0)
    }
    // 如果不是NoTagVNode，则调用setDomValue方法设置DOM元素的值
    return setDomValue(this.element as HTMLElement, value)
  }

  /**
   * 获取元素的HTML内容
   * 返回元素的HTML字符串表示
   *
   * @returns {string} 返回元素的HTML字符串表示
   */
  html(): string {
    // 检查元素是否支持outerHTML属性
    if ('outerHTML' in this.element) return this.element.outerHTML
    // 如果不支持outerHTML，则返回元素的nodeValue或空字符串
    return this.element.nodeValue || ''
  }

  /**
   * 获取元素的文本内容
   * 返回元素的文本内容字符串
   *
   * @returns {string} 返回元素的文本内容字符串，如果无法获取则返回空字符串
   */
  text(): string {
    // 检查元素是否支持textContent属性
    if ('textContent' in this.element) return (this.element as HTMLElement).textContent
    return (this.element as HTMLElement)?.nodeValue ?? ''
  }

  /**
   * 卸载组件/元素的方法
   * 该方法用于执行组件的卸载操作，清理相关资源
   * 调用后会移除DOM元素并清理相关的事件监听器和数据
   */
  unmount(): void {
    // 调用内部节点实例的卸载方法
    this.#node.unmount()
  }

  /**
   * 查找并返回第一个非组件类型的VNode节点
   * 这是一个私有方法，用于在组件树中查找实际的DOM元素节点
   *
   * @param node - 起始VNode节点
   * @returns {VNode} 第一个非组件类型的VNode节点
   */
  #findElementNode(node: VNode): VNode {
    // 循环查找，直到找到非组件类型的节点
    while (WidgetVNode.is(node)) {
      // 移动到子节点继续查找
      node = node.child
    }
    // 返回找到的元素节点
    return node
  }

}
