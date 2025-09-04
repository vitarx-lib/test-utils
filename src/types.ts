/**
 * @file 类型定义（严格模式，禁止 any）
 */

/**
 * 挂载选项
 */
export interface MountOptions<Props = unknown> {
  /** 组件 props */
  props?: Props
  /** 自定义容器，用于挂载元素快照/DOM */
  attachTo?: HTMLElement | null
  /** DOM 级别桩：键为 CSS 选择器，值为占位字符串 */
  domStubs?: Record<string, string>
}

/**
 * 组件包装器（Wrapper）
 */
export interface Wrapper<Props = unknown> {
  /** 根容器 */
  element: HTMLElement
  /** 当前组件 props 的只读快照 */
  props: Readonly<Props>

  /** 更新 props 并触发重渲染 */
  setProps(nextProps: Partial<Props>): Promise<void>

  /** 查找选择器（返回子包装器） */
  find(selector: string): Wrapper | null

  /** 触发事件 */
  trigger(event: string, payload?: unknown): Promise<void>

  /** 设置 input/textarea/select 的值并触发事件 */
  setValue(value: unknown): Promise<void>

  /** 返回当前 HTML 文本 */
  html(): string

  /** 卸载组件 */
  unmount(): void
}

/**
 * Spy 类型：函数调用的跟踪与记录
 */
export interface SpyCall<Args extends unknown[] = unknown[], R = unknown> {
  args: Args
  returned?: R
  threw?: unknown
}

export interface SpyFunction<Args extends unknown[] = unknown[], R = unknown> {
  /** 是否为 spy 函数标记 */
  __isSpy: true
  /** 调用记录 */
  __calls: SpyCall<Args, R>[]

  (...args: Args): R
}
