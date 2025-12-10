import type { BotContext } from './context'

/**
 * Command Handler - 类似 API Route Handler
 */
export type CommandHandler = (ctx: BotContext) => Promise<void> | void

/**
 * Command Matcher - 判断是否匹配命令
 */
export type CommandMatcher = (
  message: string
) => boolean | { params?: Record<string, unknown> }

/**
 * Command Definition - 命令定义
 */
export interface CommandDefinition {
  // 命令名称
  name: string

  // 命令描述
  description?: string

  // 匹配规则（可以是字符串、正则或函数）
  match: string | string[] | RegExp | CommandMatcher

  // 处理函数
  handler: CommandHandler
}

/**
 * 定义命令的辅助函数 - 类似 defineEventHandler
 */
export function defineCommand(
  definition: CommandDefinition
): CommandDefinition {
  return definition
}

/**
 * 简化版：直接定义处理函数
 */
export function defineCommandHandler(
  match: CommandDefinition['match'],
  handler: CommandHandler
): CommandDefinition {
  return {
    name: typeof match === 'string' ? match : 'command',
    match,
    handler,
  }
}
