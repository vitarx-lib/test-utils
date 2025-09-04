/**
 * @file 测试工具主入口
 */

export { createTestingApp, TestingApp } from './testingApp.js'
export { mount, Wrapper } from './mount.js'
export type { MountOptions, SpyFunction, SpyCall } from './types.js'
export { nextTick, flushPromises, setValue } from './utils.js'
export { createSpy, isSpy, getCalls, resetCalls } from './spy.js'
