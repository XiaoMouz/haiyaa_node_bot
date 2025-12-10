import { defineCommand } from '../types'
import { useLottery } from '../composables'
import { reply } from '../utils'

/**
 * Lottery Command - 抽老婆命令
 */
export default defineCommand({
  name: 'lottery',
  description: '抽取今日老婆',

  match: ['抽老婆', '今日老婆', 'lp'],

  async handler(ctx) {
    const { getTodayLottery, draw } = useLottery()

    try {
      if (!ctx.group) {
        return
      }

      // 获取群成员列表
      const groupMembers = await ctx.bot.get_group_member_list({
        group_id: ctx.group.id,
      })

      const memberIds = groupMembers.map((m) => m.user_id)

      // 检查今日是否已抽过
      const existing = await getTodayLottery(ctx.sender.id, ctx.group.id)

      if (existing) {
        await reply(
          ctx,
          `你今天已经抽过老婆了哦！是 [${
            groupMembers.find((m) => m.user_id === existing.selectedUin)
              ?.nickname
          }]\n剩余重抽次数：${existing.remainingChances}`
        )
        return
      }

      // 抽取
      const lottery = await draw(ctx.sender.id, ctx.group.id, memberIds)

      await reply(
        ctx,
        `恭喜你抽到了今日老婆：[${
          groupMembers.find((m) => m.user_id === lottery.selectedUin)?.nickname
        }]\n剩余重抽次数：${lottery.remainingChances}`
      )

      console.log(`[Lottery] ${ctx.sender.id} drew ${lottery.selectedUin}`)
    } catch (error) {
      console.error('[Lottery] Error:', error)
      await reply(ctx, '抽老婆时出错了，请稍后再试~')
    }
  },
})
