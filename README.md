# @vitarx/test-utils

[![npm version](https://badge.fury.io/js/@vitarx%2Ftest-utils.svg)](https://badge.fury.io/js/@vitarx%2Ftest-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Vitarx 官方测试工具库，提供类似 `@vue/test-utils` 的 API 风格，专为 `vitest` 测试框架优化设计。

## 特性

- 🎯 简单直观的 API 设计
- 🔧 完整的组件测试支持
- 📦 内置 Spy 工具
- 🎭 DOM 级别桩支持
- ⚡️ 异步操作处理
- 📝 TypeScript 完整支持

## 安装

```bash
npm i -D @vitarx/test-utils
```

## 快速开始

### 基本用法

```tsx
import { describe, it, expect } from 'vitest'
import { mount, nextTick } from '@vitarx/test-utils'

function Counter() {
  let count = 0
  return (
    <div>
      <span class='count'>{count}</span>
      <button class='inc' onClick={() => (count += 1)}>+</button>
    </div>
  )
}

describe('计数器', () => {
  it('点击加一', async () => {
    const wrapper = mount(Counter)
    await wrapper.find('.inc')?.trigger('click')
    await nextTick()
    expect(wrapper.find('.count')?.html()).toContain('1')
  })
})

```

### 异步测试

```tsx
import { ref } from 'vitarx'
import { flushPromises, mount } from '@vitarx/test-utils'

function AsyncComponent() {
  const data = ref('')
  const loadData = async () => {
    const result = await fetchData()
    data.value = result
  }
  return (
    <div>
      <span class='data'>{data}</span>
      <button class='load' onClick={loadData}>Load</button>
    </div>
  )
}

describe('异步组件', () => {
  it('加载数据', async () => {
    const wrapper = mount(AsyncComponent)
    await wrapper.find('.load')?.trigger('click')
    await flushPromises()
    expect(wrapper.find('.data')?.text()).toBe('loaded')
  })
})

```

## API文档

### 核心方法

#### mount(component, options)

挂载组件到测试环境。

参数：

- `component`: 要挂载的组件
- `options`: 挂载选项
    - `props`: 组件属性
    - `attachTo`: 自定义挂载容器
    - `domStubs`: DOM 级别替换配置
      返回值： `Wrapper` 实例

```tsx
const wrapper = mount(MyComponent, {
  props: { title: 'Hello' },
  attachTo: document.body,
  domStubs: { '.child': '<div data-stub>stub</div>' }
})
```

#### Wrapper 实例方法

- 查找方法
    - `findAll(selector: string): Wrapper[]` - 查找所有匹配的元素
    - `find(selector: string): Wrapper | null` - 查找第一个匹配的元素

```ts
const items = wrapper.findAll('.item')
const firstItem = wrapper.find('.item')
``` 

- 交互方法
    - `trigger(event: string, payload?): Promise<void>` - 触发事件
    - `setProps(partial)` - 设置组件/元素属性
    - `setValue(value)` - 设置表单元素的值

```ts
await wrapper.find('button').trigger('click')
await wrapper.find('input').setValue('test')
await wrapper.setProps({ title: 'New Title' })
```

- 查询方法
    - `html(): string` - 获取组件/元素 HTML
    - `text(): string` - 获取组件/元素文本
    - `isVisible(): boolean` - 判断元素是否可见
    - `exists(): boolean` - 判断元素是否存在于DOM树中

```ts
expect(wrapper.html()).toContain('expected')
expect(wrapper.text()).toBe('text content')
expect(wrapper.isVisible()).toBe(true)
expect(wrapper.exists()).toBe(true)
```

- 生命周期

```ts
wrapper.unmount()
```

### 工具函数：

- `nextTick()` - 等待下一个 tick

```ts
await nextTick()
```

- `flushPromises()` - 等待所有 Promise fulfilled

```ts
await flushPromises()
```

### DOM 级替换

- `domStubs`（mount 选项）：形如 `{ '.child': '<div data-stub></div>' }` 的 DOM 级替换，适合快速替换某些渲染输出

示例：

```tsx
import { mount } from '@vitarx/test-utils'

function Parent() {
  return (
    <div>
      <Child class='child' />
    </div>
  )
}

// DOM 级桩，直接替换输出
const wrapper = mount(Parent, { domStubs: { '.child': '<div data-stub>stub</div>' } })
expect(wrapper.html()).toContain('data-stub')
```

### Spy 工具

- `createSpy(impl?)`：创建 spy 函数；`isSpy(fn)`、`getCalls(fn)`、`resetCalls(fn)`

示例：

```tsx
import { mount, createSpy, getCalls } from '@vitarx/test-utils'

describe('spy', () => {
  it('记录事件调用', async () => {
    const onClick = createSpy()
    const wrapper = mount(() => (
      <button class='btn' onClick={onClick}>OK</button>
    ))
    await wrapper.find('.btn')?.trigger('click')
    expect(getCalls(onClick).length).toBe(1)
  })
})
```

## 约束

- 需要在浏览器环境或 jsdom 环境运行（依赖 DOM API）
- 推荐使用 `vi.mock()` 进行组件级别的模拟
