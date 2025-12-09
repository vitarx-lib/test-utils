/**
 * @file 创建测试用的 App 实例
 */

import {
  createVNode,
  mountNode,
  nextTick as vNextTick,
  NodeState,
  type VNodeInputProps,
  type WidgetNode,
  type WidgetType
} from 'vitarx'


/**
 * 创建一个测试应用程序实例
 */
export class TestingApp {
  /**
   * 等待下一个tick
   */
  nextTick: typeof vNextTick = vNextTick
  // 声明一个变量用于存储节点实例，初始值为null
  private node: WidgetNode | null = null

  /**
   * 挂载组件到指定容器
   * @param component 要挂载的组件
   * @param props 传递给组件的属性
   * @param container 挂载的目标DOM元素
   * @param domStubs DOM级别桩：键为CSS选择器，值为占位字符串
   * @returns {WidgetNode} 返回挂载的组件实例
   */
  mount<C extends WidgetType>(
    component: C,
    props: VNodeInputProps<C>,
    container: HTMLElement,
    domStubs?: Record<string, string>
  ): WidgetNode {
    // 如果已经挂载，抛出错误提示先卸载
    if (this.node && this.node.state !== NodeState.Activated) throw new Error(`App 已挂载，请先调用unmount卸载！`)
    this.node = createVNode(component, props) as WidgetNode
    // 挂载应用到容器
    mountNode(this.node, container)
    // 应用 DOM 级别桩替换
    if (domStubs) {
      for (const [selector, html] of Object.entries(domStubs)) {
        const nodes = Array.from(container.querySelectorAll(selector))
        for (const node of nodes) {
          const placeholder = document.createElement('div')
          placeholder.innerHTML = html
          const replacement = placeholder.firstElementChild
          if (replacement) {
            node.replaceWith(replacement)
          } else {
            // 若传入的是纯文本或无包裹标签，则使用一个占位 div 包裹
            const wrap = document.createElement('div')
            wrap.setAttribute('data-vx-stub', 'true')
            wrap.textContent = html
            node.replaceWith(wrap)
          }
        }
      }
    }
    return this.node
  }

  /**
   * 卸载已挂载的应用
   */
  unmount() {
    if (this.node && this.node.state !== NodeState.Unmounted) {
      // 重置应用实例和挂载状态
      mountNode(this.node)
    }
    this.node = null
  }
}

/**
 * 创建一个测试应用程序实例
 *
 * @returns {TestingApp} 返回一个包含挂载、卸载和nextTick方法的对象
 */
export function createTestingApp(): TestingApp {
  return new TestingApp()
}
