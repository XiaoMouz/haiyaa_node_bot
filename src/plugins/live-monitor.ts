import { definePlugin } from '../types'
import { SendMessageSegment, Structs } from 'node-napcat-ts'
import { fetchImage, sleep } from '../utils'
import { BilibiliRoomInfoResponse } from '../clients/Model/BilibiliRoomInfo'

/**
 * Live Monitor Plugin - B站直播监控
 */
export default definePlugin(async ({ app }) => {
  console.log('[Plugin:LiveMonitor] Starting live monitor...')

  // 配置
  const ROOM_ID = parseInt(process.env.BILIBILI_LIVE_ROOM_ID || '22601574')
  const NOTIFY_GROUP = parseInt(
    process.env.BILIBILI_NOTIFY_GROUP_UIN || '749823895'
  )
  const POLL_INTERVAL = parseInt(
    process.env.BILIBILI_POLL_INTERVAL_MS || '30000'
  )

  let lastLiveStatus = -1
  let isMonitoring = false

  /**
   * 获取直播间信息
   */
  async function getRoomInfo(
    roomId: number
  ): Promise<BilibiliRoomInfoResponse> {
    const response = await fetch(
      `https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${roomId}`
    )
    return response.json() as Promise<BilibiliRoomInfoResponse>
  }

  /**
   * 检查直播状态
   */
  async function checkRoomStatus() {
    try {
      const roomInfo = await getRoomInfo(ROOM_ID)
      const currentStatus = roomInfo.data.live_status

      // 状态变化检测
      if (lastLiveStatus !== -1 && lastLiveStatus !== currentStatus) {
        if (currentStatus === 1) {
          // 开播
          await notifyLiveStart(roomInfo.data)
        } else if (currentStatus === 0 || currentStatus === 2) {
          // 下播
          await notifyLiveStop()
        }
      }

      lastLiveStatus = currentStatus
    } catch (error) {
      console.error('[LiveMonitor] Error checking room status:', error)
    }
  }

  /**
   * 通知开播
   */
  async function notifyLiveStart(roomData: BilibiliRoomInfoResponse['data']) {
    try {
      console.log(`[LiveMonitor] Room ${ROOM_ID} went live!`)

      const title = roomData.title || '直播开始啦！'
      const coverUrl = roomData.user_cover || roomData.keyframe

      let coverBuffer: Buffer | null = null
      if (coverUrl) {
        try {
          coverBuffer = await fetchImage(coverUrl)
        } catch (error) {
          console.error('[LiveMonitor] Error fetching cover:', error)
        }
      }

      const messageText = `【直播通知】\n${title}\n房间号：${ROOM_ID}\n快来看吧！`
      const message: SendMessageSegment[] = []

      // @全体成员
      try {
        message.push(Structs.at('all'))
        message.push(Structs.text('\n'))
      } catch {}

      message.push(Structs.text(messageText))

      if (coverBuffer) {
        const base64Cover = coverBuffer.toString('base64')
        message.push(Structs.image(coverUrl))
      }

      await app.getBot().send_group_msg({
        group_id: NOTIFY_GROUP,
        message,
      })

      console.log(`[LiveMonitor] Notification sent to group ${NOTIFY_GROUP}`)
    } catch (error) {
      console.error(
        '[LiveMonitor] Error sending live start notification:',
        error
      )
    }
  }

  /**
   * 通知下播
   */
  async function notifyLiveStop() {
    try {
      console.log(`[LiveMonitor] Room ${ROOM_ID} stopped live`)

      const messageText = `【直播通知】\n直播结束了\n没看到的人好好反省自己`

      await app.getBot().send_group_msg({
        group_id: NOTIFY_GROUP,
        message: [Structs.text(messageText)],
      })

      console.log(
        `[LiveMonitor] Stop notification sent to group ${NOTIFY_GROUP}`
      )
    } catch (error) {
      console.error(
        '[LiveMonitor] Error sending live stop notification:',
        error
      )
    }
  }

  /**
   * 启动监控
   */
  async function start() {
    if (isMonitoring) return

    isMonitoring = true
    console.log(`[LiveMonitor] Monitoring room ${ROOM_ID}`)

    // 初始检查
    await checkRoomStatus()

    // 定时检查
    setInterval(checkRoomStatus, POLL_INTERVAL)
  }

  // 等待 Bot 连接后启动
  setTimeout(start, 5000)
})
