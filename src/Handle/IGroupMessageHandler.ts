import { NCWebsocket } from 'node-napcat-ts'

export interface GroupMessageContext {
  bot: NCWebsocket
  groupUin: number
  senderUin: number
  senderNickname: string
  message: string
  messageId: number
  rawMessage: any
}

export interface IGroupMessageHandler {
  canHandle(message: string): boolean
  handleAsync(context: GroupMessageContext): Promise<void>
}
