# @vitarx/test-vitarx

Vitarx 官方测试工具，API 风格接近 `@vue/test-utils`，适配 `vitest`。

## 安装

```bash
npm i -D @vitarx/test-vitarx
```

## 快速上手

```tsx
import { describe, it, expect } from 'vitest'
import { mount, nextTick } from '@vitarx/test-vitarx'

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

## API

- `createTestingApp()`：创建测试用 App 容器
- `mount(component, options)`：挂载组件
- `Wrapper` 实例方法：
  - `find(selector)`、`trigger(event, payload)`、`setProps(partial)`、`setValue(value)`、`html()`、`unmount()`
- 工具函数：`nextTick`、`flushPromises`、`setValue`

### DOM 级替换

- `domStubs`（mount 选项）：形如 `{ '.child': '<div data-stub></div>' }` 的 DOM 级替换，适合快速替换某些渲染输出

示例：
```tsx
import { mount } from '@vitarx/test-vitarx'

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
import { mount, createSpy, getCalls } from '@vitarx/test-vitarx'

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
- 推荐使用 `vi.mock()` 进行组件级别的模拟，而非内置的 stub 功能
