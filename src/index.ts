/**
 * @fileoverview Vitarx 测试工具库主入口文件
 * @description 提供用于测试 Vitarx 组件的核心工具函数和类型定义
 * @module @vitarx/test-utils
 * @version 2.0.0-alpha.0
 * @author zhuchonglin <8210856@qq.com>
 * @license MIT
 * @see {@link https://github.com/vitarx-lib/test-utils|GitHub Repository}
 */

/**
 * 挂载组件到测试环境的函数
 * @function
 * @see module:@vitarx/test-utils.mount
 */
export { mount } from './mount.js'

/**
 * 清空 Promise 微任务队列的工具函数
 * @function
 * @see module:@vitarx/test-utils.flushPromises
 */
export { flushPromises } from './utils.js'
