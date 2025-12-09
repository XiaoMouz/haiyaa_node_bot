import { NCWebsocket } from 'node-napcat-ts'
import { IGroupMessageHandler, GroupMessageContext } from '../Handle/IGroupMessageHandler.js'
import { BlacklistHandler } from '../Handle/BlacklistHandler.js'
import { FortuneHandler } from '../Handle/FortuneHandler.js'
import { LotteryHandler } from '../Handle/LotteryHandler.js'

export class MessageService {
  private handlers: IGroupMessageHandler[]
  private blacklistHandler: BlacklistHandler

  constructor(
    fortuneHandler: FortuneHandler,
    lotteryHandler: LotteryHandler,
    blacklistHandler: BlacklistHandler
  ) {
    this.blacklistHandler = blacklistHandler
    this.handlers = [fortuneHandler, lotteryHandler]
  }

  async handleGroupMessageAsync(
    bot: NCWebsocket,
    groupUin: number,
    senderUin: number,
    senderNickname: string,
    message: string,
    messageId: number,
    rawMessage: any
  ): Promise<void> {
    try {
      // Create context
      const context: GroupMessageContext = {
        bot,
        groupUin,
        senderUin,
        senderNickname,
        message,
        messageId,
        rawMessage,
      }

      // Check blacklist first (highest priority)
      if (this.blacklistHandler.shouldMonitor(senderUin, groupUin)) {
        await this.blacklistHandler.handleAsync(context)
        return // Blacklist handler handles the message, don't process other handlers
      }

      // Try each handler
      for (const handler of this.handlers) {
        if (handler.canHandle(message)) {
          await handler.handleAsync(context)
          return // Only one handler processes the message
        }
      }

      // No handler matched, do nothing
    } catch (error) {
      console.error('[MessageService] Error handling message:', error)
    }
  }
}
