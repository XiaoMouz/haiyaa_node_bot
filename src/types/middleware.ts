import type { BotContext } from './context'

/**
 * Middleware Next Function
 */
export type MiddlewareNext = () => Promise<void> | void

/**
 * Middleware Handler - 类似 Express/h3 middleware
 */
export type MiddlewareHandler = (
  ctx: BotContext,
  next: MiddlewareNext
) => Promise<void> | void

/**
 * Middleware Definition
 */
export interface MiddlewareDefinition {
  name: string
  handler: MiddlewareHandler

  // 优先级（数字越小越先执行）
  priority?: number

  // 是否只在特定条件下执行
  condition?: (ctx: BotContext) => boolean
}

/**
 * 定义中间件的辅助函数
 */
export function defineMiddleware(
  handler: MiddlewareHandler,
  options?: Partial<Omit<MiddlewareDefinition, 'handler'>>
): MiddlewareDefinition {
  return {
    name: options?.name || 'middleware',
    handler,
    priority: options?.priority ?? 0,
    condition: options?.condition,
  }
}
