import { defineCommand } from '../types'
import { useLottery, useGroupMembers } from '../composables'
import { getAvatarUrl, reply, sendImage } from '../utils'

/**
 * Reroll Command - 重抽老婆命令
 */
export default defineCommand({
  name: 'reroll',
  description: '重新抽取老婆',

  match: ['再抽一次', 'clp'],

  async handler(ctx) {
    const startTime = performance.now() // 开始计时

    const { redraw } = useLottery()
    const { getGroupMembers, getGroupMemberIds } = useGroupMembers()

    try {
      if (!ctx.group) {
        return
      }

      // 从缓存获取群成员列表
      const groupMembers = await getGroupMembers(ctx.group.id)
      const memberIds = await getGroupMemberIds(ctx.group.id)

      // 重抽
      const result = await redraw(ctx.sender.id, ctx.group.id, memberIds)

      if (!result.success) {
        const selectedMember = groupMembers.find(
          (m) => m.user_id === result.lottery.selectedUin
        )
        await sendImage(
          ctx,
          getAvatarUrl(result.lottery.selectedUin),
          `不能重抽了${
            result.failReason ? `，因为${result.failReason}` : ''
          }，你的老婆是${selectedMember?.nickname || selectedMember?.card || result.lottery.selectedUin}`,
          true
        )

        const duration = performance.now() - startTime
        console.log(
          `[Lottery] ${ctx.sender.id} cannot redraw: ${result.failReason || 'no chances'} (${duration.toFixed(2)}ms)`
        )
        return
      }

      const selectedMember = groupMembers.find(
        (m) => m.user_id === result.lottery.selectedUin
      )
      await sendImage(
        ctx,
        getAvatarUrl(result.lottery.selectedUin),
        `你重抽到了：[${selectedMember?.nickname || selectedMember?.card || result.lottery.selectedUin}]\n剩余重抽次数：${result.lottery.remainingChances}`,
        true
      )

      const duration = performance.now() - startTime
      console.log(
        `[Lottery] ${ctx.sender.id} redrew to ${result.lottery.selectedUin} (${duration.toFixed(2)}ms)`
      )
    } catch (error: any) {
      const duration = performance.now() - startTime
      console.error(
        `[Lottery] Reroll error: (sender ${ctx.sender.nickname} | ${ctx.sender.id}) (${duration.toFixed(2)}ms):`,
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
