import { defineCommand } from '../types'
import { useLottery } from '../composables'
import { getAvatarUrl, reply, sendImage } from '../utils'

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

      if (!result.success) {
        await sendImage(
          ctx,
          getAvatarUrl(result.lottery.selectedUin),
          `不能重抽了${
            result.failReason ? `，因为${result.failReason}` : ''
          }，你的老婆是${
            groupMembers.find((m) => m.user_id === result.lottery.selectedUin)
              ?.nickname
          }`,
          true
        )
        return
      }

      await sendImage(
        ctx,
        getAvatarUrl(result.lottery.selectedUin),
        `你重抽到了：[${
          groupMembers.find((m) => m.user_id === result.lottery.selectedUin)
            ?.nickname
        }]\n剩余重抽次数：${result.lottery.remainingChances}`,
        true
      )

      console.log(
        `[Lottery] ${ctx.sender.id} redrew to ${result.lottery.selectedUin}`
      )
    } catch (error: any) {
      console.error(
        `[Lottery] Reroll error: (sender ${ctx.sender.nickname} | ${ctx.sender.id}):`,
        error
      )
      if (error.message === 'No lottery record found') {
        await reply(ctx, '你今天还没有抽过老婆哦，请先使用"抽老婆"命令')
      } else {
        await reply(ctx, '重抽时出错了，请稍后再试~')
      }
    }
  },
})
