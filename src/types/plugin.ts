import type { BotApp } from '../app/app'

/**
 * Plugin Context - 插件初始化时的上下文
 */
export interface PluginContext {
  app: BotApp
}

/**
 * Plugin Definition
 */
export type Plugin = (ctx: PluginContext) => Promise<void> | void

/**
 * 定义插件的辅助函数
 */
export function definePlugin(plugin: Plugin): Plugin {
  return plugin
}
