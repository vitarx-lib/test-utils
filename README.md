# @vitarx/test-utils

[![npm version](https://badge.fury.io/js/@vitarx%2Ftest-utils.svg)](https://badge.fury.io/js/@vitarx/test-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Vitarx 官方测试工具库，提供简洁优雅的组件测试体验

## 📖 简介

`@vitarx/test-utils` 是专为 Vitarx 框架设计的测试工具库，提供了完整的组件挂载、DOM 操作和异步处理功能。

## ✨ 特性

- 🎯 **简单直观** - API 设计简洁明了，易于理解和使用
- 🔧 **功能完整** - 支持组件挂载、DOM 查找、事件触发等完整测试流程
- 📦 **TypeScript 支持** - 完整的类型定义，提供优秀的 IDE 智能提示
- ⚡️ **异步处理** - 内置 Promise 微任务队列清空工具
- 🎭 **DOM 桩支持** - 支持 DOM 级别的元素替换，简化复杂组件测试
- 🧪 **测试框架无关** - 可与 Vitest、Jest 等任何测试框架配合使用

## 📦 安装

```bash
# 使用 npm
npm install -D @vitarx/test-utils

# 使用 yarn
yarn add -D @vitarx/test-utils

# 使用 pnpm
pnpm add -D @vitarx/test-utils
```

## 🚀 快速开始

### 基本示例

```tsx
import { describe, it, expect } from 'vitest'
import { mount } from '@vitarx/test-utils'
import { ref } from 'vitarx'

function Counter() {
  const count = ref(0)
  const increment = () => count.value++

  return (
    <div>
      <span class="count">{count}</span>
      <button class="increment" onClick={increment}>+</button>
    </div>
  )
}

describe('计数器组件', () => {
  it('应该正确渲染初始值', () => {
    const wrapper = mount(Counter)
    expect(wrapper.find('.count')?.text()).toBe('0')
    wrapper.unmount()
  })

  it('点击按钮应该增加计数', async () => {
    const wrapper = mount(Counter)
    const button = wrapper.find('.increment')

    await button?.trigger('click')
    expect(wrapper.find('.count')?.text()).toBe('1')

    wrapper.unmount()
  })
})
```

## 📚 API 文档

### 核心函数

#### `mount(component, options?)`

将组件挂载到测试环境，返回 Wrapper 实例。

**参数：**

- `component` - 要挂载的组件函数
- `options` - 可选的挂载配置对象
    - `props` - 传递给组件的属性
    - `attachTo` - 自定义挂载容器元素
    - `domStubs` - DOM 级别桩替换配置
    - `usePlugins` - AppPlugin[]

**返回值：** `Wrapper` 实例

**示例：**

```tsx
// 基本用法
const wrapper = mount(MyComponent)

const count = ref(42)
// 传递 props
const wrapper = mount(MyComponent, {
  props: {
    title: 'Hello World',
    get count() {
      // 动态参数
      return count.value
    }
  }
})

// 使用自定义容器
const container = document.createElement('div')
document.body.appendChild(container)
const wrapper = mount(MyComponent, {
  attachTo: container
})

// 使用 DOM 桩替换
const wrapper = mount(ParentComponent, {
  domStubs: {
    '.child-component': '<div class="stub">Mocked</div>'
  }
})

// 使用插件
const wrapper = mount(MyComponent, {
  usePlugins: [plugin1, plugin2]
})

```

#### `flushPromises()`

清空当前事件循环中的 Promise 微任务队列。

**返回值：** `Promise<void>`

**使用场景：**

- 组件内部存在异步逻辑（如 Promise.then / async 函数）
- 需要确保异步操作完成后再进行断言

**示例：**

```tsx
import { mount, flushPromises } from '@vitarx/test-utils'

async function AsyncComponent() {
  const data = ref('')

  const loadData = async () => {
    const result = await fetchData()
    data.value = result
  }

  return (
    <div>
      <span class="data">{data}</span>
      <button class="load" onClick={loadData}>Load</button>
    </div>
  )
}

it('应该正确加载异步数据', async () => {
  const wrapper = mount(AsyncComponent)

  await wrapper.find('.load')?.trigger('click')
  await flushPromises() // 等待所有 Promise 完成

  expect(wrapper.find('.data')?.text()).toBe('loaded')

  wrapper.unmount()
})
```

### Wrapper 类

Wrapper 是测试工具的核心类，提供了丰富的 DOM 操作和查询方法。

#### 属性访问

##### `wrapper.props`

获取组件的 props 对象（只读）。

```tsx
function MyComponent(props: { message: string }) {
  return <div>{props.message}</div>
}

const wrapper = mount(MyComponent, {
  props: { message: 'Hello' }
})

console.log(wrapper.props.message) // 'Hello'
```

##### `wrapper.view`

获取内部的视图对象实例。

```tsx
const wrapper = mount(MyComponent)
const view = wrapper.view

// 访问底层 DOM 节点
console.log(view.node.tagName)
```

#### DOM 查询

##### `find(selector)`

查找匹配选择器的第一个元素。

```tsx
const wrapper = mount(MyComponent)

// 查找单个元素
const button = wrapper.find('button')
const item = wrapper.find('.item')
const deep = wrapper.find('.container .child')

if (button) {
  await button.trigger('click')
}
```

##### `findAll(selector)`

查找匹配选择器的所有元素。

```tsx
const wrapper = mount(() => (
  <div>
    <span class="item">Item 1</span>
    <span class="item">Item 2</span>
    <span class="item">Item 3</span>
  </div>
))

const items = wrapper.findAll('.item')
console.log(items.length) // 3
items.forEach(item => console.log(item.text()))
```

#### 属性操作

##### `attributes()`

获取元素的所有属性。

```tsx
const wrapper = mount(() => (
  <div id="test" class="container" data-value="123">Content</div>
))

const attrs = wrapper.attributes()
console.log(attrs) // { id: 'test', class: 'container', 'data-value': '123' }
```

##### `attributes(key)`

获取元素的指定属性值。

```tsx
const wrapper = mount(() => (
  <div id="test" class="container">Content</div>
))

const id = wrapper.attributes('id')
console.log(id) // 'test'

const notExist = wrapper.attributes('not-exist')
console.log(notExist) // ''
```

#### 类名操作

##### `classes()`

获取元素的所有类名。

```tsx
const wrapper = mount(() => (
  <div class="active visible highlighted">Content</div>
))

const classes = wrapper.classes()
console.log(classes) // ['active', 'visible', 'highlighted']
```

##### `classes(className)`

检查元素是否包含指定类名。

```tsx
const wrapper = mount(() => (
  <div class="active visible">Content</div>
))

console.log(wrapper.classes('active')) // true
console.log(wrapper.classes('hidden')) // false
```

#### 状态检查

##### `exists()`

检查元素是否存在于 DOM 树中。

```tsx
const wrapper = mount(MyComponent)
console.log(wrapper.exists()) // true

wrapper.unmount()
console.log(wrapper.exists()) // false
```

##### `isVisible()`

检查元素是否可见。

元素需要满足以下条件才被视为可见：

1. 存在于文档中
2. `display` 不为 `none`
3. `visibility` 不为 `hidden`

```tsx
const wrapper1 = mount(() => <div>Visible</div>)
console.log(wrapper1.isVisible()) // true

const wrapper2 = mount(() => <div style="display: none;">Hidden</div>)
console.log(wrapper2.isVisible()) // false

const wrapper3 = mount(() => <div style="visibility: hidden;">Hidden</div>)
console.log(wrapper3.isVisible()) // false
```

#### 交互操作

##### `trigger(event, payload?)`

在元素上触发事件。

```tsx
const wrapper = mount(() => (
  <button onClick={() => console.log('clicked')}>Click Me</button>
))

// 触发点击事件
await wrapper.trigger('click')

// 触发自定义事件并携带数据
await wrapper.trigger('custom', { message: 'test' })
```

##### `setValue(value)`

为表单元素设置值。

支持的元素类型：

- `input` - 设置 value 并触发 input 和 change 事件
- `textarea` - 设置 value 并触发 input 和 change 事件
- `select` - 根据 value 匹配 option 并触发 change 事件

```tsx
// 设置 input 值
const input = wrapper.find('input')
await input?.setValue('new value')

// 设置 select 值
const select = wrapper.find('select')
await select?.setValue('option2')

// 设置 textarea 值
const textarea = wrapper.find('textarea')
await textarea?.setValue('textarea content')
```

#### 内容获取

##### `html()`

获取元素的 HTML 字符串表示。

```tsx
const wrapper = mount(() => (
  <div class="container">
    <span>Hello</span>
  </div>
))

console.log(wrapper.html())
// '<div class="container"><span>Hello</span></div>'
```

##### `text()`

获取元素的文本内容。

```tsx
const wrapper = mount(() => (
  <div>
    <span>Hello</span>
    <span> World</span>
  </div>
))

console.log(wrapper.text()) // 'Hello World'
```

#### 生命周期

##### `unmount()`

卸载组件并清理资源。

```tsx
const wrapper = mount(MyComponent)

// 使用 wrapper 进行测试...

// 测试完成后卸载
wrapper.unmount()
console.log(wrapper.exists()) // false
```

## 🎯 使用场景

### 测试异步组件

```tsx
import { mount, flushPromises } from '@vitarx/test-utils'
import { ref } from 'vitarx'

function AsyncDataComponent() {
  const data = ref(null)
  const loading = ref(false)

  const fetchData = async () => {
    loading.value = true
    const result = await fetch('/api/data')
    data.value = await result.json()
    loading.value = false
  }

  return (
    <div>
      {loading.value ? (
        <span class="loading">Loading...</span>
      ) : (
        <span class="data">{data.value}</span>
      )}
      <button class="fetch" onClick={fetchData}>Fetch</button>
    </div>
  )
}

describe('异步数据组件', () => {
  it('应该正确处理异步数据加载', async () => {
    const wrapper = mount(AsyncDataComponent)

    // 初始状态
    expect(wrapper.find('.data')?.text()).toBe('')

    // 触发数据加载
    await wrapper.find('.fetch')?.trigger('click')
    expect(wrapper.find('.loading')).toBeDefined()

    // 等待异步操作完成
    await flushPromises()
    expect(wrapper.find('.data')?.text()).not.toBe('')

    wrapper.unmount()
  })
})
```

### 测试表单组件

```tsx
import { mount } from '@vitarx/test-utils'
import { ref } from 'vitarx'

function FormComponent() {
  const formData = ref({
    username: '',
    email: ''
  })

  const handleSubmit = () => {
    console.log('Submit:', formData.value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        class="username"
        value={formData.value.username}
        onInput={(e) => formData.value.username = e.target.value}
      />
      <input
        class="email"
        value={formData.value.email}
        onInput={(e) => formData.value.email = e.target.value}
      />
      <button class="submit" type="submit">Submit</button>
    </form>
  )
}

describe('表单组件', () => {
  it('应该正确处理表单输入', async () => {
    const wrapper = mount(FormComponent)

    // 填写表单
    await wrapper.find('.username')?.setValue('john_doe')
    await wrapper.find('.email')?.setValue('john@example.com')

    // 提交表单
    await wrapper.find('.submit')?.trigger('click')

    wrapper.unmount()
  })
})
```

### 使用 DOM 桩简化测试

```tsx
import { mount } from '@vitarx/test-utils'

function ComplexParent() {
  return (
    <div class="parent">
      <ComplexChild class="child" />
      <AnotherComplexWidget class="widget" />
    </div>
  )
}

describe('复杂父组件', () => {
  it('应该正确渲染（使用桩替换）', () => {
    const wrapper = mount(ComplexParent, {
      domStubs: {
        '.child': '<div class="child-stub">Mocked Child</div>',
        '.widget': '<div class="widget-stub">Mocked Widget</div>'
      }
    })

    expect(wrapper.find('.child-stub')).toBeDefined()
    expect(wrapper.find('.widget-stub')).toBeDefined()

    wrapper.unmount()
  })
})
```

### 测试条件渲染

```tsx
import { mount } from '@vitarx/test-utils'
import { ref } from 'vitarx'

function ConditionalComponent() {
  const showDetails = ref(false)

  return (
    <div>
      <button
        class="toggle"
        onClick={() => showDetails.value = !showDetails.value}
      >
        Toggle
      </button>
      {showDetails.value && (
        <div class="details">Details Content</div>
      )}
    </div>
  )
}

describe('条件渲染组件', () => {
  it('应该正确切换显示状态', async () => {
    const wrapper = mount(ConditionalComponent)

    // 初始状态：详情不可见
    expect(wrapper.find('.details')).toBeNull()

    // 点击切换按钮
    await wrapper.find('.toggle')?.trigger('click')

    // 详情应该可见
    expect(wrapper.find('.details')).toBeDefined()
    expect(wrapper.find('.details')?.text()).toBe('Details Content')

    // 再次点击切换按钮
    await wrapper.find('.toggle')?.trigger('click')

    // 详情应该再次隐藏
    expect(wrapper.find('.details')).toBeNull()

    wrapper.unmount()
  })
})
```

## 🔧 配置

### Vitest 配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vitarx from '@vitarx/plugin-vite'

export default defineConfig({
  plugins: [vitarx()],
  test: {
    environment: 'jsdom',
    globals: true
  }
})
```

### TypeScript 配置

确保 `tsconfig.json` 包含以下配置：

```json
{
  "compilerOptions": {
    "types": [
      "vitarx",
      "vitest/globals"
    ]
  }
}
```

## ⚠️ 注意事项

1. **环境要求** - 需要在浏览器环境或 jsdom 环境运行（依赖 DOM API）
2. **资源清理** - 测试完成后建议调用 `wrapper.unmount()` 清理资源
3. **异步处理** - 涉及异步操作时，使用 `flushPromises()` 确保操作完成
4. **类型安全** - 充分利用 TypeScript 类型检查，避免运行时错误

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

[MIT](LICENSE)

## 🔗 相关链接

- [Vitarx 官方文档](https://github.com/vitarx-lib/vitarx)
- [GitHub 仓库](https://github.com/vitarx-lib/test-utils)
- [NPM 包](https://www.npmjs.com/package/@vitarx/test-utils)
