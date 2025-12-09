import { IGroupMessageHandler, GroupMessageContext } from './IGroupMessageHandler.js'
import { BotSettings } from '../Config/BotSettings.js'
import { FortuneService } from '../Storage/FortuneService.js'
import { Structs } from 'node-napcat-ts'
import fs from 'fs/promises'

export class FortuneHandler implements IGroupMessageHandler {
  private fortuneService: FortuneService

  constructor(fortuneService: FortuneService) {
    this.fortuneService = fortuneService
  }

  canHandle(message: string): boolean {
    const trimmed = message.trim()
    return BotSettings.FortuneCommands.some((cmd) => trimmed === cmd)
  }

  async handleAsync(context: GroupMessageContext): Promise<void> {
    try {
      // Check if already drawn today
      const existingFortune = await this.fortuneService.getTodayFortune(
        context.senderUin,
        context.groupUin
      )

      let fortune
      let isNewDraw = false

      if (existingFortune) {
        fortune = existingFortune
      } else {
        fortune = await this.fortuneService.drawFortune(
          context.senderUin,
          context.groupUin
        )
        isNewDraw = true
      }

      // Get fortune image path
      const imagePath = BotSettings.FortuneImages[
        fortune.fortuneType as keyof typeof BotSettings.FortuneImages
      ]

      // Prepare response message
      const responseText = isNewDraw
        ? `你今天的运势是：${fortune.fortuneType}`
        : `你今天已经抽过运势了哦，是：${fortune.fortuneType}`

      // Read image file
      const imageBuffer = await fs.readFile(imagePath)
      const base64Image = imageBuffer.toString('base64')

      // Send message with image
      await context.bot.send_group_msg({
        group_id: context.groupUin,
        message: [
          Structs.reply(context.messageId),
          Structs.text(responseText),
          Structs.image(`base64://${base64Image}`),
        ],
      })

      console.log(
        `[Fortune] ${context.senderUin} drew ${fortune.fortuneType} in group ${context.groupUin} (new: ${isNewDraw})`
      )
    } catch (error) {
      console.error('[FortuneHandler] Error:', error)
      await context.bot.send_group_msg({
        group_id: context.groupUin,
        message: [
          Structs.reply(context.messageId),
          Structs.text('抽运势时出错了，请稍后再试~'),
        ],
      })
    }
  }
}
