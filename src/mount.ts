/**
 * @file 提供 mount API
 */

import { nextTick as vNextTick, type VNodeProps, type WidgetType } from 'vitarx'
import { createTestingApp } from './testingApp.js'
import type { MountOptions, Wrapper } from './types.js'
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
function createWrapper<C extends WidgetType, Props = VNodeProps<C>>(
  component: C,
  options: MountOptions<Props>
): Wrapper<Props> {
  const app = createTestingApp()
  const container = createContainer(options.attachTo)
  let currentProps: Props = options.props ?? {} as Props
  const isFn = typeof component === 'function'
  app.mount(component, currentProps, container, options.domStubs)

  return {
    element: container,
    get props() {
      return Object.freeze({ ...(currentProps as any) }) as Readonly<Props>
    },
    async setProps(nextProps: Partial<Props>) {
      currentProps = { ...(currentProps as any), ...(nextProps as any) }
      // 重新挂载根组件以应用 props 变化
      app.unmount()
      app.mount(
        isFn ? (component as any) : () => component,
        currentProps,
        container,
        options.domStubs
      )
      await vNextTick()
    },
    find(selector: string) {
      const el = container.querySelector(selector)
      if (!el) return null
      // 子选择器的 wrapper，只提供基本 DOM 能力
      return {
        element: el as HTMLElement,
        props: {} as any,
        async setProps() {
          throw new Error('子元素不支持 setProps')
        },
        find(sel: string) {
          const sub = (el as HTMLElement).querySelector(sel)
          return sub
            ? ({
              element: sub as HTMLElement,
              props: {} as any,
              async setProps() {
                throw new Error('子元素不支持 setProps')
              },
              find: () => null,
              async trigger(event: string, payload?: unknown) {
                await tryTrigger(sub as HTMLElement, event, payload)
              },
              async setValue(value: unknown) {
                await setDomValue(sub as HTMLElement, value)
              },
              html() {
                return (sub as HTMLElement).outerHTML
              },
              unmount() {
                app.unmount()
              }
            } as Wrapper<any>)
            : null
        },
        async trigger(event: string, payload?: unknown) {
          await tryTrigger(el as HTMLElement, event, payload)
        },
        async setValue(value: unknown) {
          await setDomValue(el as HTMLElement, value)
        },
        html() {
          return (el as HTMLElement).outerHTML
        },
        unmount() {
          app.unmount()
        }
      } as Wrapper<any>
    },
    async trigger(event: string, payload?: unknown) {
      await tryTrigger(container, event, payload)
    },
    async setValue(value: unknown) {
      await setDomValue(container, value)
    },
    html() {
      return container.innerHTML
    },
    unmount() {
      app.unmount()
      if (!options.attachTo && container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }
  }
}

/**
 * 挂载组件到测试环境
 * @param component 要挂载的组件函数或元素
 * @param options 挂载选项
 * @returns Wrapper 组件包装器
 */
export function mount<C extends WidgetType, Props = VNodeProps<C>>(
  component: C,
  options: MountOptions<Props> = {}
): Wrapper<Props> {
  const { props = {} as Props } = options
  return createWrapper(component, { ...options, props })
}
