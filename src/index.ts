/**
 * @file 测试工具主入口
 */

export { createTestingApp } from './testingApp.js'
export { mount } from './mount.js'
export type { MountOptions, Wrapper, SpyFunction, SpyCall } from './types.js'
export { nextTick, flushPromises, setValue } from './utils.js'
export { createSpy, isSpy, getCalls, resetCalls } from './spy.js'
