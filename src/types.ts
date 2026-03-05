/**
 * 挂载选项
 */
export interface MountOptions<Props = unknown> {
  /** 组件 props */
  props?: Props
  /** 自定义容器，用于挂载元素快照/DOM */
  attachTo?: Element | null
  /** DOM 级别桩：键为 CSS 选择器，值为占位字符串 */
  domStubs?: Record<string, string>
}
