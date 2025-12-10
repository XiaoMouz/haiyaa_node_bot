import { useStorage } from './useStorage'
import { getCurrentDate } from '../utils'

export interface Lottery {
  initiatorUin: number
  groupUin: number
  date: string
  selectedUin: number
  remainingChances: number
  drawnUins: number[]
}

/**
 * useLottery - 抽老婆系统 composable
 */
export function useLottery() {
  const storage = useStorage<Lottery>('./Data/lottery.json')

  /**
   * 获取今日抽签记录
   */
  async function getTodayLottery(
    uin: number,
    groupUin: number
  ): Promise<Lottery | undefined> {
    const today = getCurrentDate()
    return storage.find(
      (l) =>
        l.initiatorUin === uin && l.groupUin === groupUin && l.date === today
    )
  }

  /**
   * 抽老婆
   */
  async function draw(
    uin: number,
    groupUin: number,
    groupMembers: number[]
  ): Promise<Lottery> {
    // 检查是否已抽过
    const existing = await getTodayLottery(uin, groupUin)
    if (existing) {
      return existing
    }

    // 过滤掉自己
    const candidates = groupMembers.filter((m) => m !== uin)
    if (candidates.length === 0) {
      throw new Error('No candidates available')
    }

    // 随机选择
    const selected = candidates[Math.floor(Math.random() * candidates.length)]

    const lottery: Lottery = {
      initiatorUin: uin,
      groupUin,
      date: getCurrentDate(),
      selectedUin: selected,
      remainingChances: 3,
      drawnUins: [selected],
    }

    await storage.append(lottery)
    return lottery
  }

  /**
   * 重新抽取
   */
  async function redraw(
    uin: number,
    groupUin: number,
    groupMembers: number[]
  ): Promise<{
    success: boolean
    lottery: Lottery
    failReason?: string
  }> {
    const existing = await getTodayLottery(uin, groupUin)
    if (!existing) {
      throw new Error('No lottery record found')
    }

    if (existing.remainingChances <= 0) {
      return {
        success: false,
        lottery: existing,
      }
    }

    // 过滤掉已抽过的和自己
    const candidates = groupMembers.filter(
      (m) => m !== uin && !existing.drawnUins.includes(m)
    )

    if (candidates.length === 0) {
      return {
        success: false,
        lottery: existing,
        failReason: '没有更多群友可以给你抽了',
      }
    }

    // 随机选择
    const selected = candidates[Math.floor(Math.random() * candidates.length)]

    // 更新记录
    const updated: Lottery = {
      ...existing,
      selectedUin: selected,
      remainingChances: existing.remainingChances - 1,
      drawnUins: [...existing.drawnUins, selected],
    }
    console.log('Updated lottery:', updated)

    await storage.upsert(
      updated,
      (l) =>
        l.initiatorUin === uin &&
        l.groupUin === groupUin &&
        l.date === getCurrentDate()
    )

    return {
      success: true,
      lottery: updated,
    }
  }

  return {
    getTodayLottery,
    draw,
    redraw,
  }
}
