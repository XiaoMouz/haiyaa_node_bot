import { IGroupMessageHandler, GroupMessageContext } from './IGroupMessageHandler.js'
import { BotSettings } from '../Config/BotSettings.js'
import { LotteryService } from '../Storage/LotteryService.js'
import { Structs } from 'node-napcat-ts'
import { Tool } from '../Util/Tool.js'

export class LotteryHandler implements IGroupMessageHandler {
  private lotteryService: LotteryService

  constructor(lotteryService: LotteryService) {
    this.lotteryService = lotteryService
  }

  canHandle(message: string): boolean {
    const trimmed = message.trim()
    return (
      BotSettings.WifeLotteryCommands.some((cmd) => trimmed === cmd) ||
      BotSettings.RerollCommands.some((cmd) => trimmed === cmd)
    )
  }

  private isRerollCommand(message: string): boolean {
    const trimmed = message.trim()
    return BotSettings.RerollCommands.some((cmd) => trimmed === cmd)
  }

  async handleAsync(context: GroupMessageContext): Promise<void> {
    try {
      const isReroll = this.isRerollCommand(context.message)

      if (isReroll) {
        await this.handleReroll(context)
      } else {
        await this.handleDraw(context)
      }
    } catch (error) {
      console.error('[LotteryHandler] Error:', error)
      await context.bot.send_group_msg({
        group_id: context.groupUin,
        message: [
          Structs.reply(context.messageId),
          Structs.text('抽老婆时出错了，请稍后再试~'),
        ],
      })
    }
  }

  private async handleDraw(context: GroupMessageContext): Promise<void> {
    // Check if already drawn today
    const existingLottery = await this.lotteryService.getTodayLottery(
      context.senderUin,
      context.groupUin
    )

    if (existingLottery) {
      // Already drawn, show existing result
      const avatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${existingLottery.selectedUin}&s=640`
      const avatarBuffer = await Tool.fetchImageAsync(avatarUrl)
      const base64Avatar = avatarBuffer.toString('base64')

      const remainingText =
        existingLottery.remainingChances > 0
          ? `\n剩余重抽次数：${existingLottery.remainingChances}`
          : '\n今天的重抽次数已用完'

      await context.bot.send_group_msg({
        group_id: context.groupUin,
        message: [
          Structs.reply(context.messageId),
          Structs.text(`你今天已经抽过了！你的老婆是：`),
          Structs.at(existingLottery.selectedUin),
          Structs.text(remainingText),
          Structs.image(`base64://${base64Avatar}`),
        ],
      })
      return
    }

    // Get group member list
    const memberListResponse = await context.bot.get_group_member_list({
      group_id: context.groupUin,
    })

    if (!memberListResponse || !Array.isArray(memberListResponse)) {
      await context.bot.send_group_msg({
        group_id: context.groupUin,
        message: [
          Structs.reply(context.messageId),
          Structs.text('获取群成员列表失败，请稍后再试~'),
        ],
      })
      return
    }

    const memberUins = memberListResponse.map((member: any) => member.user_id)

    // Draw lottery
    const lottery = await this.lotteryService.drawLottery(
      context.senderUin,
      context.groupUin,
      memberUins
    )

    // Get avatar
    const avatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${lottery.selectedUin}&s=640`
    const avatarBuffer = await Tool.fetchImageAsync(avatarUrl)
    const base64Avatar = avatarBuffer.toString('base64')

    const remainingText =
      lottery.remainingChances > 0
        ? `\n剩余重抽次数：${lottery.remainingChances}`
        : ''

    await context.bot.send_group_msg({
      group_id: context.groupUin,
      message: [
        Structs.reply(context.messageId),
        Structs.text(`恭喜！你今天的老婆是：`),
        Structs.at(lottery.selectedUin),
        Structs.text(remainingText),
        Structs.image(`base64://${base64Avatar}`),
      ],
    })

    console.log(
      `[Lottery] ${context.senderUin} drew ${lottery.selectedUin} in group ${context.groupUin}`
    )
  }

  private async handleReroll(context: GroupMessageContext): Promise<void> {
    // Get group member list
    const memberListResponse = await context.bot.get_group_member_list({
      group_id: context.groupUin,
    })

    if (!memberListResponse || !Array.isArray(memberListResponse)) {
      await context.bot.send_group_msg({
        group_id: context.groupUin,
        message: [
          Structs.reply(context.messageId),
          Structs.text('获取群成员列表失败，请稍后再试~'),
        ],
      })
      return
    }

    const memberUins = memberListResponse.map((member: any) => member.user_id)

    // Attempt reroll
    const result = await this.lotteryService.rerollLottery(
      context.senderUin,
      context.groupUin,
      memberUins
    )

    if (!result.success) {
      await context.bot.send_group_msg({
        group_id: context.groupUin,
        message: [
          Structs.reply(context.messageId),
          Structs.text(result.message || '重抽失败'),
        ],
      })
      return
    }

    // Get new avatar
    const avatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${result.lottery!.selectedUin}&s=640`
    const avatarBuffer = await Tool.fetchImageAsync(avatarUrl)
    const base64Avatar = avatarBuffer.toString('base64')

    const remainingText =
      result.lottery!.remainingChances > 0
        ? `\n剩余重抽次数：${result.lottery!.remainingChances}`
        : '\n今天的重抽次数已用完'

    await context.bot.send_group_msg({
      group_id: context.groupUin,
      message: [
        Structs.reply(context.messageId),
        Structs.text(`重抽成功！你的新老婆是：`),
        Structs.at(result.lottery!.selectedUin),
        Structs.text(remainingText),
        Structs.image(`base64://${base64Avatar}`),
      ],
    })

    console.log(
      `[Lottery] ${context.senderUin} rerolled to ${result.lottery!.selectedUin} in group ${context.groupUin}`
    )
  }
}
