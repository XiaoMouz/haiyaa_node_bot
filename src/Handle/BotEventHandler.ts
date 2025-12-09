import { NCWebsocket, Structs } from 'node-napcat-ts'
import { MessageService } from '../Service/MessageService.js'
import { BotSettings } from '../Config/BotSettings.js'
import fs from 'fs/promises'

export class BotEventHandler {
  private messageService: MessageService

  constructor(messageService: MessageService) {
    this.messageService = messageService
  }

  setupEventHandlers(bot: NCWebsocket): void {
    // Handle group messages
    bot.on('message.group.normal', async (ctx) => {
      try {
        await this.handleGroupMessage(bot, ctx)
      } catch (error) {
        console.error(
          '[BotEventHandler] Error in group message handler:',
          error
        )
      }
    })

    // Handle private messages
    bot.on('message.private.friend', async (ctx) => {
      try {
        await this.handlePrivateMessage(bot, ctx)
      } catch (error) {
        console.error(
          '[BotEventHandler] Error in private message handler:',
          error
        )
      }
    })

    // Handle bot online
    bot.on('meta_event.lifecycle.connect', () => {
      console.log('[Bot] Connected and online!')
    })

    // Log other events if needed
    console.log('[BotEventHandler] Event handlers registered')
  }

  private async handleGroupMessage(bot: NCWebsocket, ctx: any): Promise<void> {
    // Extract message text
    const messageText = ctx.message
      .map((m: any) =>
        'text' in m.data && m.data.text ? m.data.text.toString() : ''
      )
      .join('')
      .trim()

    if (!messageText) return

    const groupUin = ctx.group_id
    const senderUin = ctx.sender.user_id
    const senderNickname = ctx.sender.nickname || ''
    const messageId = ctx.message_id

    console.log(
      `[Group ${groupUin}] ${senderNickname}(${senderUin}): ${messageText}`
    )

    // Route to message service
    await this.messageService.handleGroupMessageAsync(
      bot,
      groupUin,
      senderUin,
      senderNickname,
      messageText,
      messageId,
      ctx
    )
  }

  private async handlePrivateMessage(
    bot: NCWebsocket,
    ctx: any
  ): Promise<void> {
    try {
      const messageText = ctx.message
        .map((m: any) =>
          'text' in m.data && m.data.text ? m.data.text.toString() : ''
        )
        .join('')
        .trim()

      const senderUin = ctx.sender.user_id
      const senderNickname = ctx.sender.nickname || ''

      console.log(`[Private] ${senderNickname}(${senderUin}): ${messageText}`)

      // Send default response
      const imageBuffer = await fs.readFile(BotSettings.MaoImagePath)
      const base64Image = imageBuffer.toString('base64')

      await bot.send_private_msg({
        user_id: senderUin,
        message: [
          Structs.text(BotSettings.PrivateMessageDefaultText),
          Structs.image(`base64://${base64Image}`),
        ],
      })
    } catch (error) {
      console.error('[BotEventHandler] Error handling private message:', error)
      // Send text-only response if image fails
      await bot.send_private_msg({
        user_id: ctx.sender.user_id,
        message: [Structs.text(BotSettings.PrivateMessageDefaultText)],
      })
    }
  }
}
