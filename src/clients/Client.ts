import { BilibiliRoomInfoResponse } from './Model/BilibiliRoomInfo.js'

/**
 * @deprecated
 * Bilibili Client - 用于与Bilibili直播API交互
 * OOP 设计时使用的客户端封装
 */
export class BilibiliClient {
  private static readonly API_BASE_URL = 'https://api.live.bilibili.com'

  static async getRoomInfo(roomId: number): Promise<BilibiliRoomInfoResponse> {
    try {
      const url = `${this.API_BASE_URL}/room/v1/Room/get_info?room_id=${roomId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = (await response.json()) as BilibiliRoomInfoResponse

      if (data.code !== 0) {
        throw new Error(`Bilibili API error: ${data.message || data.msg}`)
      }

      return data
    } catch (error) {
      console.error('Error fetching Bilibili room info:', error)
      throw error
    }
  }

  static async isLive(roomId: number): Promise<boolean> {
    try {
      const roomInfo = await this.getRoomInfo(roomId)
      return roomInfo.data.live_status === 1
    } catch (error) {
      console.error('Error checking live status:', error)
      return false
    }
  }
}
