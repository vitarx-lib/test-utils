/**
 * @fileoverview 测试工具类型定义文件
 * @description 定义测试工具库中使用的核心类型和接口
 * @module @vitarx/test-utils/types
 */

import type { AppPlugin } from 'vitarx'


/**
 * 组件挂载选项配置接口
 * @template Props - 组件属性类型，默认为 unknown
 * @description 用于配置组件挂载行为的选项对象，支持属性传递、自定义容器和 DOM 桩替换
 * @example
 * ```typescript
 * // 基本用法
 * const options: MountOptions<{ message: string }> = {
 *   props: { message: 'Hello' }
 * }
 *
 * // 使用自定义容器
 * const container = document.createElement('div');
 * const options: MountOptions = {
 *   attachTo: container,
 *   domStubs: {
 *     '.child-component': '<div>stubbed</div>'
 *   }
 * }
 * ```
 */
export interface MountOptions<Props = unknown> {
  /**
   * 组件属性对象
   * @description 传递给被挂载组件的属性值，将被注入到组件的 props 参数中
   * @type {Props}
   * @example
   * ```typescript
   * mount(MyComponent, {
   *   props: { title: 'Test', count: 42 }
   * })
   * ```
   */
  props?: Props
  /**
   * 自定义挂载容器元素
   * @description 指定组件挂载的目标 DOM 元素。如果未提供，将自动创建一个带有 data-vx-test-container 属性的 div 容器并添加到 document.body
   * @type {Element | null}
   * @example
   * ```typescript
   * const customContainer = document.getElementById('test-container');
   * mount(MyComponent, { attachTo: customContainer })
   * ```
   */
  attachTo?: Element | null
  /**
   * DOM 级别桩替换配置
   * @description 用于在测试中替换特定 DOM 元素的配置对象。键为 CSS 选择器，值为替换后的 HTML 字符串。
   * 适用于模拟子组件或复杂 DOM 结构的简化版本。
   * @type {Record<string, string>}
   * @example
   * ```typescript
   * mount(ParentComponent, {
   *   domStubs: {
   *     '.child-component': '<div class="stub">Mocked Child</div>',
   *     '.complex-widget': 'Simple Text'
   *   }
   * })
   * ```
   */
  domStubs?: Record<string, string>
  /**
   * 应用插件
   *
   * @example
   * ```typescript
   * mount(MyComponent, {
   *   useAppPlugins: [plugin1, plugin2]
   * })
   * ```
   */
  usePlugins?: AppPlugin[]
}
