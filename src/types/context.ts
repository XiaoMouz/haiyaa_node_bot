import type { NCWebsocket } from 'node-napcat-ts'

/**
 * Bot Context - 类似 h3 的 event context
 * 贯穿整个请求生命周期
 */
export interface BotContext {
  // Bot 实例
  bot: NCWebsocket

  // 消息信息
  message: {
    id: number
    text: string
    raw: any
  }

  // 发送者信息
  sender: {
    id: number
    nickname: string
  }

  // 群组信息（可选）
  group?: {
    id: number
  }

  // 请求级别的存储（类似 h3 的 context）
  store: Map<string, any>

  // 匹配的命令信息（由路由填充）
  matched?: {
    command: string
    params: Record<string, any>
  }
}

/**
 * 创建 Context - 工厂函数
 */
export function createContext(data: {
  bot: NCWebsocket
  message: { id: number; text: string; raw: any }
  sender: { id: number; nickname: string }
  group?: { id: number }
}): BotContext {
  return {
    ...data,
    store: new Map(),
  }
}
