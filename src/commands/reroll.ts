import { defineCommand } from '../types'
import { useLottery } from '../composables'
import { reply } from '../utils'

/**
 * Reroll Command - 重抽老婆命令
 */
export default defineCommand({
  name: 'reroll',
  description: '重新抽取老婆',

  match: ['再抽一次', 'clp'],

  async handler(ctx) {
    const { redraw } = useLottery()

    try {
      if (!ctx.group) {
        return
      }

      // 获取群成员列表
      const groupMembers = await ctx.bot.get_group_member_list({
        group_id: ctx.group.id,
      })

      const memberIds = groupMembers.map((m) => m.user_id)

      // 重抽
      const result = await redraw(ctx.sender.id, ctx.group.id, memberIds)

      if (!result) {
        await reply(ctx, '不能重抽了')
        return
      }

      await reply(
        ctx,
        `重新抽取成功！你的新老婆是：[${
          groupMembers.find((m) => m.user_id === result.selectedUin)?.nickname
        }]\n剩余重抽次数：${result.remainingChances}`
      )

      console.log(`[Lottery] ${ctx.sender.id} redrew to ${result.selectedUin}`)
    } catch (error: any) {
      console.error('[Lottery] Reroll error:', error)
      if (error.message === 'No lottery record found') {
        await reply(ctx, '你今天还没有抽过老婆哦，请先使用"抽老婆"命令')
      } else {
        await reply(ctx, '重抽时出错了，请稍后再试~')
      }
    }
  },
})
