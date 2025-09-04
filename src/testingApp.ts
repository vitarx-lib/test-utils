/**
 * @file 创建测试用的 App 实例
 */

import {
  createElement,
  nextTick as vNextTick,
  type VNodeProps,
  type WidgetType,
  type WidgetVNode
} from 'vitarx'

export interface TestingApp {
  mount: (
    component: any,
    props: any,
    container: HTMLElement,
    domStubs?: Record<string, string>
  ) => void
  unmount: () => void
  nextTick: typeof vNextTick
}

/**
 * 创建一个测试应用程序实例
 *
 * @returns {TestingApp} 返回一个包含挂载、卸载和nextTick方法的对象
 */
export function createTestingApp(): TestingApp {
  // 声明一个变量用于存储应用程序实例，初始值为null
  let app: WidgetVNode | null = null

  return {
    /**
     * 挂载组件到指定容器
     * @param component 要挂载的组件
     * @param props 传递给组件的属性
     * @param container 挂载的目标DOM元素
     * @param domStubs DOM级别桩：键为CSS选择器，值为占位字符串
     */
    mount<C extends WidgetType>(
      component: C,
      props: VNodeProps<C>,
      container: HTMLElement,
      domStubs?: Record<string, string>
    ) {
      // 如果已经挂载，抛出错误提示先卸载
      if (app?.state !== 'notMounted') throw new Error('App 已挂载，请先调用unmount卸载！')
      app = createElement(component, props) as WidgetVNode
      // 挂载应用到容器
      app.mount(container)
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
    },
    /**
     * 卸载已挂载的应用
     */
    unmount() {
      if (app && app.state !== 'unloaded') {
        // 重置应用实例和挂载状态
        app.unmount()
      }
      app = null
    },
    /**
     * 等待下一个tick
     */
    nextTick: vNextTick
  }
}
