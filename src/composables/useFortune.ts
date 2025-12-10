import { useStorage } from './useStorage'
import { getCurrentDate, weightedRandom } from '../utils'

export interface Fortune {
  uin: number
  groupUin: number
  date: string
  fortuneType: string
}

export interface FortuneMeta {
  name: string
  weight: number
}

/**
 * useFortune - 运势系统 composable
 */
export function useFortune() {
  const fortuneStorage = useStorage<Fortune>('./Data/fortune.json')
  const metaStorage = useStorage<FortuneMeta>('./Data/fortune_meta.json')

  /**
   * 初始化运势配置
   */
  async function initialize() {
    const metaData = await metaStorage.load()

    if (metaData.length === 0) {
      const defaultFortunes: FortuneMeta[] = [
        { name: '大吉', weight: 1 },
        { name: '小吉', weight: 2 },
        { name: '末吉', weight: 3 },
        { name: '平', weight: 3 },
        { name: '小凶', weight: 2 },
        { name: '大凶', weight: 1 },
      ]
      await metaStorage.save(defaultFortunes)
    }
  }

  /**
   * 获取今日运势
   */
  async function getTodayFortune(uin: number, groupUin: number): Promise<Fortune | undefined> {
    const today = getCurrentDate()
    return fortuneStorage.find(
      (f) => f.uin === uin && f.groupUin === groupUin && f.date === today
    )
  }

  /**
   * 抽取运势
   */
  async function drawFortune(uin: number, groupUin: number): Promise<Fortune> {
    // 检查是否已抽过
    const existing = await getTodayFortune(uin, groupUin)
    if (existing) {
      return existing
    }

    // 加载运势类型
    const fortuneTypes = await metaStorage.load()

    // 加权随机选择
    const selected = weightedRandom(fortuneTypes)

    // 创建记录
    const fortune: Fortune = {
      uin,
      groupUin,
      date: getCurrentDate(),
      fortuneType: selected.name,
    }

    // 保存
    await fortuneStorage.append(fortune)

    return fortune
  }

  return {
    initialize,
    getTodayFortune,
    drawFortune,
  }
}
