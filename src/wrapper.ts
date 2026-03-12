/**
 * @fileoverview 视图包装器模块
 * @description 提供视图包装器类和元素查找功能，用于测试组件和 DOM 元素
 * @module @vitarx/test-utils/wrapper
 */

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
 * @description 该函数递归处理组件视图和动态视图，解包嵌套的逻辑结构，直到找到最基础的视图类型（HostView 或 ListView）。
 * 这是一个内部辅助函数，用于简化视图树的遍历和查找操作。
 *
 * @private
 * @function unlogicView
 * @param {View} view - 输入的逻辑视图，可能是组件视图、动态视图或基础视图
 * @returns {HostView | ListView} 返回转换后的宿主视图(HostView)或列表视图(ListView)
 * @example
 * ```typescript
 * // 内部使用示例
 * const logicalView = componentView.instance.subView
 * const hostView = unlogicView(logicalView)
 * // hostView 现在是 HostView 或 ListView 类型
 * ```
 */
function unlogicView(view: View): HostView | ListView {
  if (isComponentView(view)) {
    return unlogicView(view.instance!.subView)
  }
  if (isDynamicView(view)) {
    return unlogicView(view.current!)
  }
  return view
}

/**
 * 在视图树中查找匹配选择器的第一个元素
 * @description 使用深度优先搜索算法在视图树中查找匹配指定 CSS 选择器的元素。
 * 该函数会递归遍历所有子视图，包括组件视图和动态视图的内部结构。
 *
 * @private
 * @function find
 * @param {string} selector - CSS 选择器字符串，用于匹配元素
 * @param {View} view - 要搜索的视图对象
 * @returns {DOMWrapper | null} 返回匹配元素的 Wrapper 包装器，如果未找到则返回 null
 * @example
 * ```typescript
 * // 内部使用示例
 * const wrapper = find('.my-class', componentView)
 * if (wrapper) {
 *   console.log(wrapper.text())
 * }
 * ```
 */
function find(selector: string, view: View): DOMWrapper | null {
  view = unlogicView(view)
  if (isElementView(view) && view.node.matches(selector)) {
    return new Wrapper(view)
  }
  if (isFragmentView(view) || isElementView(view) || isListView(view)) {
    const children = view.children
    for (const child of children) {
      const wrapper = find(selector, child)
      if (wrapper) return wrapper
    }
  }
  return null
}

/**
 * 在视图树中查找匹配选择器的所有元素
 * @description 使用深度优先搜索算法在视图树中查找所有匹配指定 CSS 选择器的元素。
 * 该函数会递归遍历所有子视图，收集所有匹配的元素。
 *
 * @private
 * @function findAll
 * @param {string} selector - CSS 选择器字符串，用于匹配元素
 * @param {View} view - 要搜索的视图对象
 * @returns {DOMWrapper[]} 返回匹配元素的 Wrapper 数组，如果没有匹配项则返回空数组
 * @example
 * ```typescript
 * // 内部使用示例
 * const wrappers = findAll('.item', componentView)
 * wrappers.forEach(wrapper => {
 *   console.log(wrapper.text())
 * })
 * ```
 */
function findAll(selector: string, view: View): DOMWrapper[] {
  const wrappers: Wrapper<ElementView>[] = []
  view = unlogicView(view)
  if (isElementView(view) && view.node.matches(selector)) {
    wrappers.push(new Wrapper(view))
  }
  if (isFragmentView(view) || isElementView(view) || isListView(view)) {
    const children = view.children
    for (const child of children) {
      const childWrappers = findAll(selector, child)
      wrappers.push(...childWrappers)
    }
    return wrappers
  }
  return wrappers
}

/**
 * 视图包装器类
 * @description 提供对视图对象(View)的便捷操作接口，封装了节点的常用操作方法。
 * 这是测试工具库的核心类，用于包装组件视图和元素视图，提供统一的测试 API。
 *
 * 核心功能：
 * - 节点属性访问和修改（props）
 * - DOM 元素操作（element 访问、查找、可见性检查）
 * - 事件触发（trigger）
 * - 值的设置和获取（setValue）
 * - 内容获取（html、text）
 * - 组件生命周期管理（unmount）
 *
 * @template T - 视图类型，必须继承自 ComponentView 或 ElementView
 * @class Wrapper
 * @example
 * ```typescript
 * import { mount } from '@vitarx/test-utils'
 *
 * function MyComponent() {
 *   return <div class="container">Hello World</div>
 * }
 *
 * const wrapper = mount(MyComponent)
 *
 * // 访问属性
 * console.log(wrapper.props)
 *
 * // 查找子元素
 * const child = wrapper.find('.child-class')
 *
 * // 触发事件
 * await wrapper.find('button')?.trigger('click')
 *
 * // 获取内容
 * console.log(wrapper.text())
 * console.log(wrapper.html())
 *
 * // 清理
 * wrapper.unmount()
 * ```
 */
export class Wrapper<T extends ComponentView | ElementView> {
  /**
   * 私有视图存储
   * @description 使用私有字段存储视图对象，确保封装性和不可变性
   * @internal
   */
  readonly #view: T

  /**
   * 创建 Wrapper 实例
   * @constructor
   * @param {T} view - 要包装的视图对象（ComponentView 或 ElementView）
   */
  constructor(view: T) {
    this.#view = view
  }

  /**
   * 获取组件的属性对象
   * @description 返回传递给组件的 props 对象。对于 ElementView，返回空对象。
   * 返回的对象是只读的，防止意外修改。
   *
   * @readonly
   * @returns {Readonly<AnyProps>} 包含组件属性的只读对象，如果没有属性则返回空对象
   * @example
   * ```typescript
   * function MyComponent(props: { message: string }) {
   *   return <div>{props.message}</div>
   * }
   *
   * const wrapper = mount(MyComponent, {
   *   props: { message: 'Hello' }
   * })
   *
   * console.log(wrapper.props.message) // 'Hello'
   * ```
   */
  get props(): Readonly<AnyProps> {
    return this.#view.props || {}
  }

  /**
   * 获取内部视图对象
   * @description 返回包装器内部存储的视图实例，用于需要直接访问视图 API 的高级场景。
   * 返回类型为泛型 T，确保类型安全。
   *
   * @readonly
   * @returns {T} 内部存储的视图实例
   * @example
   * ```typescript
   * const wrapper = mount(MyComponent)
   * const view = wrapper.view
   *
   * // 访问视图的底层 DOM 节点
   * const node = view.node
   * console.log(node.tagName)
   * ```
   */
  public get view(): T {
    return this.#view
  }

  /**
   * 获取元素的所有属性
   * @description 返回元素所有属性的键值对对象。如果元素不是 HTMLElement，返回空对象。
   * @returns {{ [key: string]: string }} 包含所有属性的键值对对象
   * @example
   * ```typescript
   * const wrapper = mount(() => <div id="test" class="container">Content</div>)
   * const attrs = wrapper.attributes()
   * console.log(attrs) // { id: 'test', class: 'container' }
   * ```
   */
  attributes(): { [key: string]: string }

  /**
   * 获取元素的指定属性值
   * @description 返回指定属性的值。如果元素不是 HTMLElement 或属性不存在，返回空字符串。
   * @param {string} key - 要获取的属性名称
   * @returns {string} 属性值，如果属性不存在则返回空字符串
   * @example
   * ```typescript
   * const wrapper = mount(() => <div id="test" class="container">Content</div>)
   * const id = wrapper.attributes('id')
   * console.log(id) // 'test'
   * ```
   */
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
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i]
        attributes[attr.name] = attr.value
      }
      return attributes
    }
  }

  /**
   * 获取元素的所有类名
   * @description 返回元素的所有类名数组。如果元素不是 HTMLElement，返回空数组。
   * @returns {string[]} 包含所有类名的数组
   * @example
   * ```typescript
   * const wrapper = mount(() => <div class="active visible">Content</div>)
   * const classes = wrapper.classes()
   * console.log(classes) // ['active', 'visible']
   * ```
   */
  classes(): string[]

  /**
   * 检查元素是否包含指定类名
   * @description 检查元素是否包含指定的类名。如果元素不是 HTMLElement，返回 false。
   * @param {string} className - 要检查的类名
   * @returns {boolean} 如果元素包含该类名返回 true，否则返回 false
   * @example
   * ```typescript
   * const wrapper = mount(() => <div class="active visible">Content</div>)
   * const isActive = wrapper.classes('active')
   * console.log(isActive) // true
   * ```
   */
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
   * 检查元素是否存在于文档中
   * @description 通过检查节点的父节点是否存在来判断元素是否已挂载到 DOM 树中。
   * 对于 DocumentFragment，检查其起始锚点的父节点。
   * 该方法会捕获所有异常，在视图已卸载的情况下安全地返回 false。
   *
   * @returns {boolean} 如果元素存在于文档中返回 true，否则返回 false
   * @example
   * ```typescript
   * const wrapper = mount(MyComponent)
   * console.log(wrapper.exists()) // true
   *
   * wrapper.unmount()
   * console.log(wrapper.exists()) // false
   * ```
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
   * @description 综合检查元素的可见性状态，需要满足以下所有条件：
   * 1. 元素必须已经插入到文档中（exists() 返回 true）
   * 2. 元素的 style.display 属性不能为 'none'
   * 3. 元素的 style.visibility 属性不能为 'hidden'
   *
   * 注意：此方法仅检查内联样式，不检查计算样式或 CSS 类的影响。
   *
   * @returns {boolean} 如果元素可见返回 true，否则返回 false
   * @example
   * ```typescript
   * const wrapper = mount(() => <div style="display: none;">Hidden</div>)
   * console.log(wrapper.isVisible()) // false
   *
   * const visibleWrapper = mount(() => <div>Visible</div>)
   * console.log(visibleWrapper.isVisible()) // true
   * ```
   */
  isVisible(): boolean {
    if (!this.exists()) return false
    const element = this.view.node
    if (isHostElement(element)) {
      if (element.style.display === 'none') return false
      if (element.style.visibility === 'hidden') return false
    }
    return true
  }

  /**
   * 查找匹配选择器的所有元素
   * @description 使用深度优先搜索算法在当前视图的子树中查找所有匹配指定 CSS 选择器的元素。
   * 返回所有匹配元素的包装器数组。
   *
   * @param {string} selector - CSS 选择器字符串
   * @returns {DOMWrapper[]} 匹配元素的 Wrapper 数组，如果没有匹配项则返回空数组
   * @example
   * ```typescript
   * const wrapper = mount(() => (
   *   <div>
   *     <span class="item">Item 1</span>
   *     <span class="item">Item 2</span>
   *     <span class="item">Item 3</span>
   *   </div>
   * ))
   *
   * const items = wrapper.findAll('.item')
   * console.log(items.length) // 3
   * items.forEach(item => console.log(item.text()))
   * ```
   */
  findAll(selector: string): DOMWrapper[] {
    return findAll(selector, this.view)
  }

  /**
   * 查找匹配选择器的第一个元素
   * @description 使用深度优先搜索算法在当前视图的子树中查找第一个匹配指定 CSS 选择器的元素。
   * 支持复杂的选择器，包括后代选择器、子选择器等。
   *
   * @param {string} selector - CSS 选择器字符串
   * @returns {DOMWrapper | null} 匹配元素的 Wrapper，如果未找到则返回 null
   * @example
   * ```typescript
   * const wrapper = mount(() => (
   *   <div class="container">
   *     <button class="submit">Submit</button>
   *   </div>
   * ))
   *
   * const button = wrapper.find('.submit')
   * if (button) {
   *   await button.trigger('click')
   * }
   *
   * // 使用复杂选择器
   * const deepElement = wrapper.find('.container .submit')
   * ```
   */
  find(selector: string): DOMWrapper | null {
    return find(selector, this.view)
  }

  /**
   * 在元素上触发事件
   * @description 在当前元素上触发指定的 DOM 事件，并等待一帧渲染完成。
   * 事件是可冒泡、可取消的标准 Event 对象。可以通过 payload 参数传递自定义数据。
   *
   * @async
   * @param {string} event - 事件名称，例如 'click'、'input'、'change'、'custom'
   * @param {unknown} [payload] - 可选的附加数据，会被放入 event.detail 中
   * @returns {Promise<void>} 事件触发并完成渲染后 resolve
   * @throws {Error} 当元素不支持 dispatchEvent 方法时抛出错误
   * @example
   * ```typescript
   * const wrapper = mount(() => (
   *   <button onClick={() => console.log('clicked')}>Click Me</button>
   * ))
   *
   * // 触发点击事件
   * await wrapper.trigger('click')
   *
   * // 触发自定义事件并携带数据
   * await wrapper.trigger('custom', { message: 'test' })
   * ```
   */
  trigger(event: string, payload?: unknown): Promise<void> {
    return tryTrigger(this.view.node, event, payload)
  }

  /**
   * 为表单元素设置值
   * @description 为 input、textarea 或 select 元素设置值，并自动触发相应的事件。
   *
   * 行为说明：
   * - input/textarea：设置 value 属性，然后依次触发 'input' 和 'change' 事件
   * - select：根据值匹配 option 的 value 属性，设置选中状态，然后触发 'change' 事件
   * - null/undefined 会被转换为空字符串
   * - 其他类型的值会被转换为字符串
   *
   * @async
   * @param {unknown} value - 要设置的值，将被转换为字符串
   * @returns {Promise<void>} 值设置完成并触发事件后 resolve
   * @throws {Error} 当元素不是 input/textarea/select 时抛出错误
   * @example
   * ```typescript
   * // 设置 input 值
   * const input = wrapper.find('input')
   * await input?.setValue('new value')
   *
   * // 设置 select 值
   * const select = wrapper.find('select')
   * await select?.setValue('option2')
   * ```
   */
  setValue(value: unknown): Promise<void> {
    return setDomValue(this.view.node, value)
  }

  /**
   * 获取元素的 HTML 字符串
   * @description 返回元素的 outerHTML 字符串表示，包含元素本身及其所有子元素。
   * 对于 DocumentFragment，返回所有子元素的 HTML 拼接。
   *
   * @returns {string} 元素的 HTML 字符串表示
   * @example
   * ```typescript
   * const wrapper = mount(() => (
   *   <div class="container">
   *     <span>Hello</span>
   *   </div>
   * ))
   *
   * console.log(wrapper.html())
   * // 输出: '<div class="container"><span>Hello</span></div>'
   * ```
   */
  html(): string {
    return toHtml(this.view)
  }

  /**
   * 获取元素的文本内容
   * @description 返回元素内部的所有文本内容，不包含 HTML 标签。
   * 对于 DocumentFragment，返回所有子元素的文本拼接。
   *
   * @returns {string} 元素的文本内容，如果无法获取则返回空字符串
   * @example
   * ```typescript
   * const wrapper = mount(() => (
   *   <div>
   *     <span>Hello</span>
   *     <span> World</span>
   *   </div>
   * ))
   *
   * console.log(wrapper.text()) // 'Hello World'
   * ```
   */
  text(): string {
    return toText(this.view)
  }

  /**
   * 卸载组件并清理资源
   * @description 调用视图的 dispose 方法，执行组件的卸载操作，清理相关资源。
   * 卸载后，元素将从 DOM 中移除，exists() 方法将返回 false。
   *
   * 注意：卸载后的 wrapper 实例不应再被使用，否则可能抛出异常。
   *
   * @returns {void}
   * @example
   * ```typescript
   * const wrapper = mount(MyComponent)
   *
   * // 使用 wrapper 进行测试...
   *
   * // 测试完成后卸载
   * wrapper.unmount()
   * console.log(wrapper.exists()) // false
   * ```
   */
  unmount(): void {
    this.view.dispose()
  }
}

/**
 * DOM 元素包装器类型别名
 * @description 表示包装 ElementView 的 Wrapper 实例类型
 */
export type DOMWrapper = Wrapper<ElementView>

/**
 * 应用组件包装器类型别名
 * @description 表示包装 ComponentView 的 Wrapper 实例类型
 * @template T - 组件类型，默认为 Component
 */
export type AppWrapper<T extends Component = Component> = Wrapper<ComponentView<T>>
