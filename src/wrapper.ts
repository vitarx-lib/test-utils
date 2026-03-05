import {
  type AnyProps,
  type Component,
  type ComponentView,
  type ElementView,
  type HostView,
  isComponentView,
  isDynamicView,
  isElementView,
  isFragmentView,
  isListView,
  type ListView,
  type View
} from 'vitarx'
import { isHostElement, isHostFragment, setDomValue, toHtml, toText, tryTrigger } from './utils.js'

/**
 * 将逻辑视图转换为宿主视图或列表视图
 * 该函数递归处理组件视图和动态视图，直到找到最基础的视图类型
 * @param view - 输入的逻辑视图，可能是组件视图、动态视图或基础视图
 * @returns - 返回转换后的宿主视图(HostView)或列表视图(ListView)
 */
function unlogicView(view: View): HostView | ListView {
  // 如果是组件视图，则递归处理其子视图
  if (isComponentView(view)) {
    return unlogicView(view.instance!.subView)
  }
  // 如果是动态视图，则递归处理其当前视图
  if (isDynamicView(view)) {
    return unlogicView(view.current!)
  }
  // 如果不是组件视图或动态视图，则直接返回当前视图
  return view
}

/**
 * 在给定视图中查找匹配选择器的元素
 * @param selector - CSS选择器字符串
 * @param view - 要搜索的视图对象
 * @returns - 返回匹配元素的Wrapper包装器，如果未找到则返回null
 */
function find(selector: string, view: View): DOMWRapper | null {
  view = unlogicView(view)
  // 检查当前视图本身是否匹配选择器
  if (isElementView(view) && view.node.matches(selector)) {
    return new Wrapper(view)
  }
  // 检查视图是否为片段视图、元素视图或列表视图
  if (isFragmentView(view) || isElementView(view) || isListView(view)) {
    const children = view.children
    // 遍历所有子视图
    for (const child of children) {
      // 递归查找子视图
      const wrapper = find(selector, child)
      if (wrapper) return wrapper
    }
  }
  return null
}

/**
 * 查找所有匹配指定选择器的元素视图
 * @param selector - CSS选择器字符串，用于匹配元素
 * @param view - 要搜索的视图对象
 * @returns - 返回匹配的元素视图的包装器数组
 */
function findAll(selector: string, view: View): DOMWRapper[] {
  const wrappers: Wrapper<ElementView>[] = [] // 用于存储匹配结果的包装器数组
  view = unlogicView(view)
  // 检查当前视图本身是否匹配选择器
  if (isElementView(view) && view.node.matches(selector)) {
    wrappers.push(new Wrapper(view))
  }
  if (isFragmentView(view) || isElementView(view) || isListView(view)) {
    // 检查视图类型是否支持子视图
    const children = view.children // 获取当前视图的所有子视图
    for (const child of children) {
      // 遍历每个子视图
      // 递归查找子视图中的匹配元素
      const childWrappers = findAll(selector, child)
      wrappers.push(...childWrappers) // 将递归查找的结果合并到当前结果数组
    }
    return wrappers // 返回所有匹配的元素视图包装器
  }
  return wrappers // 如果视图类型不支持子视图，返回空数组
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
export class Wrapper<T extends ComponentView | ElementView> {
  // 使用私有字段存储节点，确保封装性
  readonly #view: T

  constructor(view: T) {
    this.#view = view // 挂载组件
  }

  /**
   * 获取节点的属性
   *
   * @returns {Object} - 返回一个包含节点属性的冻结对象
   */
  get props(): Readonly<AnyProps> {
    return this.#view.props || {}
  }

  /**
   * 获取视图的getter方法
   * 返回类型为泛型T，确保类型安全
   *
   * @returns {T} 返回内部存储的视图实例
   */
  public get view(): T {
    return this.#view
  }

  attributes(): { [key: string]: string }

  attributes(key: string): string

  attributes(key?: string): { [key: string]: string } | string {
    const element = this.view.node
    if (!isHostElement(element)) {
      return key ? '' : {}
    }
    if (key) {
      return element.getAttribute(key) || ''
    } else {
      const attributes: { [key: string]: string } = {}
      // 遍历 attributes
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i]
        attributes[attr.name] = attr.value
      }
      return attributes
    }
  }

  classes(): string[]
  classes(className: string): boolean
  classes(className?: string): string[] | boolean {
    const element = this.view.node
    if (!isHostElement(element)) return className ? false : []
    if (className) {
      return element.classList.contains(className)
    } else {
      return Array.from(element.classList)
    }
  }

  /**
   * 检查当前节点是否存在
   * 通过检查节点的父节点是否存在来判断
   *
   * @returns {boolean} - 如果节点的父节点不为null，则返回true，表示节点存在；否则返回false
   */
  exists(): boolean {
    try {
      const element = this.view.node
      if (isHostFragment(element)) {
        return element.$startAnchor.parentNode != null
      }
      return element.parentNode != null
    } catch {
      return false
    }
  }

  /**
   * 检查元素是否可见
   *
   * 确保元素在文档中可见，并满足以下条件：
   * - 元素必须已经插入到文档中
   * - 元素的display属性不能为'none'
   * - 元素的visibility属性不能为'hidden'
   * @returns {boolean} 如果元素可见则返回true，否则返回false
   */
  isVisible(): boolean {
    // 1. 元素必须存在于文档中
    if (!this.exists()) return false
    const element = this.view.node
    if (isHostElement(element)) {
      // 2. 检查元素的display属性是否为'none'
      if (element.style.display === 'none') return false

      // 3. 检查元素的visibility属性是否为'hidden'
      if (element.style.visibility === 'hidden') return false
    }
    return true
  }

  /**
   * 查找匹配选择器的所有元素节点
   *
   * @param selector - CSS选择器字符串
   * @returns {Wrapper<ElementView>[]} 返回匹配选择器的Wrapper数组，如果没有匹配项则返回空数组
   */
  findAll(selector: string): DOMWRapper[] {
    return findAll(selector, this.view)
  }

  /**
   * 根据选择器查找匹配的DOM元素并返回其包装器对象
   * 实现深度优先搜索来查找匹配的元素
   *
   * @param selector - 用于查找DOM元素的CSS选择器
   * @returns {DOMWRapper} 返回匹配元素的Wrapper包装器对象，如果未找到则返回null
   */
  find(selector: string): DOMWRapper | null {
    return find(selector, this.view)
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
    return tryTrigger(this.view.node, event, payload)
  }

  /**
   * 在 DOM 元素上设置一个值
   *
   * @param value - 要设置的值，类型为未知类型
   * @returns 返回一个Promise，解析为void类型
   */
  setValue(value: unknown): Promise<void> {
    return setDomValue(this.view.node, value)
  }

  /**
   * 获取元素的HTML内容
   * 返回元素的HTML字符串表示
   *
   * @returns {string} 返回元素的HTML字符串表示
   */
  html(): string {
    return toHtml(this.view)
  }

  /**
   * 获取元素的文本内容
   * 返回元素的文本内容字符串
   *
   * @returns {string} 返回元素的文本内容字符串，如果无法获取则返回空字符串
   */
  text(): string {
    return toText(this.view)
  }

  /**
   * 卸载组件/元素的方法
   *
   * 该方法用于执行组件的卸载操作，清理相关资源。
   */
  unmount(): void {
    this.view.dispose()
  }
}

export type DOMWRapper = Wrapper<ElementView>
export type AppWrapper<T extends Component = Component> = Wrapper<ComponentView<T>>
