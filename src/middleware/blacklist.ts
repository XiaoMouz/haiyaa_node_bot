import { defineMiddleware } from '../types'
import type { BotContext } from '../types'

/**
 * 黑名单中间件
 * 监控特定用户在特定群的消息
 */
export default defineMiddleware(
  async (ctx, next) => {
    // 配置（后续可以移到配置文件）
    const BLACKLISTED_UINS = [1079163675, 2498480278]
    const MONITORED_GROUPS = [1167613390, 521409608]

    // 检查是否在黑名单且在监控群
    const isBlacklisted =
      ctx.group &&
      BLACKLISTED_UINS.includes(ctx.sender.id) &&
      MONITORED_GROUPS.includes(ctx.group.id)

    if (isBlacklisted) {
      // 标记为黑名单用户
      ctx.store.set('blacklisted', true)
      console.log(`[Blacklist] Detected blacklisted user: ${ctx.sender.id}`)
    }

    await next()
  },
  {
    name: 'blacklist',
    priority: -100, // 高优先级，最先执行
  }
)
