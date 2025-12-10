# 🚀 Modern Architecture Refactoring

## 新架构概览

```
src/
├── app/              # 应用核心
│   └── app.ts        # BotApp 类（类似 Nuxt App）
├── commands/         # 命令目录（类似 API Routes）
│   ├── fortune.ts
│   ├── lottery.ts
│   └── reroll.ts
├── middleware/       # 中间件（洋葱模型）
│   ├── blacklist.ts
│   └── logger.ts
├── composables/      # Composables（类似 React Hooks）
│   ├── useFortune.ts
│   ├── useLottery.ts
│   └── useStorage.ts
├── plugins/          # 插件系统
│   ├── fortune-init.ts
│   └── live-monitor.ts
├── utils/            # 纯函数工具
│   ├── common.ts
│   └── message.ts
├── types/            # 类型定义
│   ├── context.ts
│   ├── command.ts
│   ├── middleware.ts
│   └── plugin.ts
└── index.new.ts      # 新入口文件
```

## 核心概念

### 1. **BotContext** - 请求上下文（类似 h3 Event）
```typescript
const ctx: BotContext = {
  bot: NCWebsocket,
  message: { id, text, raw },
  sender: { id, nickname },
  group?: { id },
  store: Map<string, any>,  // 请求级存储
  matched?: { command, params }
}
```

### 2. **Commands** - 命令即路由（类似 API Routes）
```typescript
// src/commands/fortune.ts
export default defineCommand({
  name: 'fortune',
  match: ['运势', '今日运势', 'ys'],
  async handler(ctx) {
    // 处理逻辑
  }
})
```

### 3. **Middleware** - 洋葱模型中间件
```typescript
// src/middleware/logger.ts
export default defineMiddleware(async (ctx, next) => {
  console.log(`Request: ${ctx.message.text}`)
  await next()
  console.log(`Response sent`)
}, { priority: -50 })
```

### 4. **Composables** - 逻辑复用（类似 React Hooks）
```typescript
// src/composables/useFortune.ts
export function useFortune() {
  const storage = useStorage<Fortune>('./Data/fortune.json')

  async function drawFortune(uin, groupUin) {
    // ...
  }

  return { drawFortune, getTodayFortune, initialize }
}
```

### 5. **Plugins** - 插件系统
```typescript
// src/plugins/fortune-init.ts
export default definePlugin(async ({ app }) => {
  const { initialize } = useFortune()
  await initialize()
})
```

### 6. **Utils** - 纯函数工具
```typescript
// src/utils/message.ts
export async function sendText(ctx: BotContext, text: string) {
  // ...
}

export async function sendImage(ctx: BotContext, path: string) {
  // ...
}
```

## 新旧对比

### 旧架构问题
❌ 手动 new 实例，硬编码依赖
❌ Service/Handler 紧耦合
❌ 到处都是 try-catch
❌ 配置散落各处
❌ 难以测试和扩展

### 新架构优势
✅ **声明式编程** - 类似 Nuxt/Next.js
✅ **函数式优先** - Composables + Utils
✅ **洋葱模型** - 清晰的请求处理流程
✅ **插件系统** - 功能模块化
✅ **类型安全** - 完整的 TypeScript 类型
✅ **易于测试** - 纯函数 + Context 注入

## 使用示例

### 添加新命令
```typescript
// src/commands/my-command.ts
import { defineCommand } from '../types'
import { reply } from '../utils'

export default defineCommand({
  name: 'hello',
  match: ['你好', 'hello'],
  async handler(ctx) {
    await reply(ctx, '你好啊！')
  }
})
```

然后在 `index.new.ts` 中注册：
```typescript
import myCommand from './commands/my-command'
app.command(myCommand)
```

### 添加新中间件
```typescript
// src/middleware/rate-limit.ts
export default defineMiddleware(async (ctx, next) => {
  // 检查频率限制
  if (isRateLimited(ctx.sender.id)) {
    return // 不调用 next() 就会中断
  }
  await next()
}, { priority: -40 })
```

### 添加新 Composable
```typescript
// src/composables/useCheckin.ts
export function useCheckin() {
  const storage = useStorage<Checkin>('./Data/checkin.json')

  async function checkin(uin: number) {
    // 签到逻辑
  }

  return { checkin }
}
```

### 添加新插件
```typescript
// src/plugins/scheduler.ts
export default definePlugin(async ({ app }) => {
  // 定时任务
  setInterval(() => {
    console.log('Scheduled task running...')
  }, 60000)
})
```

## 运行新架构

```bash
# 开发模式
bun --watch src/index.new.ts

# 或更新 package.json 的 dev script
"dev": "bun --watch src/index.new.ts"
```

## 架构特点

### 🎯 声明式 > 命令式
- 命令用 `defineCommand` 声明
- 中间件用 `defineMiddleware` 声明
- 插件用 `definePlugin` 声明

### 🔌 插件化
- 每个功能都是独立的插件
- 可以轻松启用/禁用功能

### 🧩 组合式
- Composables 提供可复用的逻辑
- 纯函数工具易于测试

### 🪝 Hooks 友好
- Context 贯穿整个请求生命周期
- Middleware 可以在任何阶段介入

### 📦 模块化
- 每个文件职责单一
- 易于维护和扩展
