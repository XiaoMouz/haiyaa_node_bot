import { NCWebsocket, Structs } from 'node-napcat-ts'
import { BilibiliClient } from '../BilibiliApi/Client.js'
import { BotSettings } from '../Config/BotSettings.js'
import { Tool } from '../Util/Tool.js'

export class LiveMonitorService {
  private bot: NCWebsocket
  private roomId: number
  private notifyGroupUin: number
  private pollIntervalMs: number
  private lastLiveStatus: number = -1
  private isMonitoring: boolean = false
  private intervalId?: NodeJS.Timeout

  constructor(bot: NCWebsocket) {
    this.bot = bot
    this.roomId = BotSettings.LiveRoomId
    this.notifyGroupUin = BotSettings.NotifyFansGroupUin
    this.pollIntervalMs = BotSettings.BilibiliPollIntervalMs
  }

  async start(): Promise<void> {
    if (this.isMonitoring) {
      console.log('[LiveMonitor] Already monitoring')
      return
    }

    this.isMonitoring = true
    console.log(`[LiveMonitor] Started monitoring room ${this.roomId}`)

    // Initial check
    await this.checkRoomStatus()

    // Set up interval
    this.intervalId = setInterval(async () => {
      await this.checkRoomStatus()
    }, this.pollIntervalMs)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    this.isMonitoring = false
    console.log('[LiveMonitor] Stopped monitoring')
  }

  private async checkRoomStatus(): Promise<void> {
    try {
      const roomInfo = await BilibiliClient.getRoomInfo(this.roomId)

      const currentStatus = roomInfo.data.live_status

      // Check if status changed
      if (this.lastLiveStatus !== -1 && this.lastLiveStatus !== currentStatus) {
        if (currentStatus === 1) {
          // Started live
          await this.notifyLiveStart(roomInfo.data)
        } else if (currentStatus === 0 || currentStatus === 2) {
          // Stopped live
          await this.notifyLiveStop(roomInfo.data)
        }
      }

      this.lastLiveStatus = currentStatus
    } catch (error) {
      console.error('[LiveMonitor] Error checking room status:', error)
    }
  }

  private async notifyLiveStart(roomData: any): Promise<void> {
    try {
      console.log(`[LiveMonitor] Room ${this.roomId} went live!`)

      const title = roomData.title || '直播开始啦！'
      const coverUrl = roomData.user_cover || roomData.keyframe

      // Fetch cover image
      let coverBuffer: Buffer | null = null
      if (coverUrl) {
        try {
          coverBuffer = await Tool.fetchImageAsync(coverUrl)
        } catch (error) {
          console.error('[LiveMonitor] Error fetching cover image:', error)
        }
      }

      // Build message
      const messageText = `【直播通知】\n${title}\n房间号：${this.roomId}\n快来看吧！`

      const message: any[] = []

      // Try to @all if bot has permissions
      try {
        message.push(Structs.at('all'))
        message.push(Structs.text('\n'))
      } catch (error) {
        // If @all fails, just send without it
      }

      message.push(Structs.text(messageText))

      if (coverBuffer) {
        const base64Cover = coverBuffer.toString('base64')
        message.push(Structs.image(`base64://${base64Cover}`))
      }

      // Send notification
      await this.bot.send_group_msg({
        group_id: this.notifyGroupUin,
        message,
      })

      console.log(
        `[LiveMonitor] Live start notification sent to group ${this.notifyGroupUin}`
      )
    } catch (error) {
      console.error(
        '[LiveMonitor] Error sending live start notification:',
        error
      )
    }
  }

  private async notifyLiveStop(roomData: any): Promise<void> {
    try {
      console.log(`[LiveMonitor] Room ${this.roomId} stopped live`)

      const messageText = `【直播通知】\n直播结束了\n没看到的人好好反省自己`

      await this.bot.send_group_msg({
        group_id: this.notifyGroupUin,
        message: [Structs.text(messageText)],
      })

      console.log(
        `[LiveMonitor] Live stop notification sent to group ${this.notifyGroupUin}`
      )
    } catch (error) {
      console.error(
        '[LiveMonitor] Error sending live stop notification:',
        error
      )
    }
  }
}
