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
