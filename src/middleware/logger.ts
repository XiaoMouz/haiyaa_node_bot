import { defineMiddleware } from '../types'

/**
 * 日志中间件
 */
export default defineMiddleware(
  async (ctx, next) => {
    const groupInfo = ctx.group ? `[Group ${ctx.group.id}]` : '[Private]'
    const userInfo = `${ctx.sender.nickname}(${ctx.sender.id})`
    const message = ctx.message.text

    console.log(`${groupInfo} ${userInfo}: ${message}`)

    await next()
  },
  {
    name: 'logger',
    priority: -50, // 较高优先级
  }
)
