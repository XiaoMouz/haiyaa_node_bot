import { IGroupMessageHandler, GroupMessageContext } from './IGroupMessageHandler.js'
import { BotSettings } from '../Config/BotSettings.js'
import { AIFetch } from '../Util/AIFetch.js'
import { Tool } from '../Util/Tool.js'
import { Structs } from 'node-napcat-ts'

export class BlacklistHandler implements IGroupMessageHandler {
  canHandle(message: string): boolean {
    // This handler doesn't check message content, it checks sender/group
    return false // Will be handled specially in MessageService
  }

  shouldMonitor(senderUin: number, groupUin: number): boolean {
    return (
      BotSettings.BlacklistedUins.includes(senderUin) &&
      BotSettings.MonitoredGroupUinsForBlacklist.includes(groupUin)
    )
  }

  async handleAsync(context: GroupMessageContext): Promise<void> {
    try {
      // Generate AI response
      const prompt = Tool.formatString(
        BotSettings.BlacklistReplyPromptFormat,
        context.message
      )

      const aiResponse = await AIFetch.generateResponse(prompt)

      if (aiResponse) {
        // Send reply
        await context.bot.send_group_msg({
          group_id: context.groupUin,
          message: [Structs.text(aiResponse)],
        })

        console.log(`[Blacklist] Replied to ${context.senderUin} in group ${context.groupUin}`)
      }
    } catch (error) {
      console.error('[BlacklistHandler] Error:', error)
    }
  }
}
