/**
 * @file spy 工具：用于跟踪函数调用（轻量版，零依赖）
 */

import type { SpyCall, SpyFunction } from './types.js'

/**
 * 创建一个 spy 函数，用于记录调用参数与返回值/异常
 */
export function createSpy<Args extends unknown[] = unknown[], R = unknown>(
  impl?: (...args: Args) => R
): SpyFunction<Args, R> {
  const calls: SpyCall<Args, R>[] = []
  const spyFn = ((...args: Args): R => {
      try {
        const result = impl ? impl(...args) : (undefined as unknown as R)
        calls.push({ args, returned: result })
        return result
      } catch (err) {
        calls.push({ args, threw: err })
        throw err
      }
    }) as SpyFunction<Args, R>
  ;(spyFn as SpyFunction<Args, R>).__isSpy = true
  ;(spyFn as SpyFunction<Args, R>).__calls = calls
  return spyFn
}

/**
 * 判断一个函数是否为 spy
 */
export function isSpy(fn: unknown): fn is SpyFunction {
  return Boolean(fn) && typeof fn === 'function' && (fn as any).__isSpy === true
}

/**
 * 获取调用记录
 */
export function getCalls<Args extends unknown[] = unknown[], R = unknown>(
  fn: SpyFunction<Args, R>
): ReadonlyArray<SpyCall<Args, R>> {
  return fn.__calls
}

/**
 * 重置调用记录
 */
export function resetCalls<Args extends unknown[] = unknown[], R = unknown>(
  fn: SpyFunction<Args, R>
): void {
  fn.__calls.length = 0
}
