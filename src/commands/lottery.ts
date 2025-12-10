import { defineCommand } from '../types'
import { useLottery, useGroupMembers } from '../composables'
import { getAvatarUrl, reply, sendImage } from '../utils'

/**
 * Lottery Command - 抽老婆命令
 */
export default defineCommand({
  name: 'lottery',
  description: '抽取今日老婆',

  match: ['抽老婆', '今日老婆', 'lp'],

  async handler(ctx) {
    const startTime = performance.now() // 开始计时

    const { getTodayLottery, draw } = useLottery()
    const { getGroupMembers, getGroupMemberIds } = useGroupMembers()

    try {
      if (!ctx.group) {
        return
      }

      // 从缓存获取群成员列表
      const groupMembers = await getGroupMembers(ctx.group.id)
      const memberIds = await getGroupMemberIds(ctx.group.id)

      // 检查今日是否已抽过
      const existing = await getTodayLottery(ctx.sender.id, ctx.group.id)

      if (existing) {
        const selectedMember = groupMembers.find(
          (m) => m.user_id === existing.selectedUin
        )
        await sendImage(
          ctx,
          getAvatarUrl(existing.selectedUin),
          `你今天已经抽过了哦！是 [${selectedMember?.nickname || selectedMember?.card || existing.selectedUin}]\n剩余重抽次数：${existing.remainingChances}`,
          true
        )

        const duration = performance.now() - startTime
        console.log(
          `[Lottery] ${ctx.sender.id} already drew today (${duration.toFixed(2)}ms)`
        )
        return
      }

      // 抽取
      const lottery = await draw(ctx.sender.id, ctx.group.id, memberIds)

      const selectedMember = groupMembers.find(
        (m) => m.user_id === lottery.selectedUin
      )
      await sendImage(
        ctx,
        getAvatarUrl(lottery.selectedUin),
        `恭喜你抽到了：[${selectedMember?.nickname || selectedMember?.card || lottery.selectedUin}]\n剩余重抽次数：${lottery.remainingChances}`,
        true
      )

      const duration = performance.now() - startTime
      console.log(
        `[Lottery] ${ctx.sender.id} drew ${lottery.selectedUin} (${duration.toFixed(2)}ms)`
      )
    } catch (error) {
      const duration = performance.now() - startTime
      console.error(
        `[Lottery] Error (sender ${ctx.sender.nickname} | ${ctx.sender.id}) (${duration.toFixed(2)}ms):`,
        error
      )
      await reply(ctx, '抽老婆时出错了，请稍后再试~')
    }
  },
})
