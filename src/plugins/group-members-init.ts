import { definePlugin } from '../types'
import { useGroupMembers } from '../composables'

/**
 * Group Members Init Plugin - 设置群成员缓存（实际初始化在 bot 连接后执行）
 */
export default definePlugin(({ app }) => {
  console.log('[Plugin:GroupMembers] Setting up group members cache...')

  const groupMembers = useGroupMembers()
  const bot = app.getBot()

  // 设置 Bot 实例
  groupMembers.setBot(bot)

  console.log(
    '[Plugin:GroupMembers] Bot instance set, cache will be initialized after connection'
  )
})
