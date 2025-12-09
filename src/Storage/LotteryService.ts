import { JsonRepository } from '../Util/JsonRepository.js'
import { BotSettings } from '../Config/BotSettings.js'
import { Lottery } from './Lottery.js'
import { Tool } from '../Util/Tool.js'

export class LotteryService {
  private repository: JsonRepository<Lottery>

  constructor() {
    this.repository = new JsonRepository<Lottery>(
      BotSettings.LotteryDataFilePath
    )
  }

  async hasDrawnToday(
    initiatorUin: number,
    groupUin: number
  ): Promise<boolean> {
    const today = Tool.getCurrentDate()
    const existing = await this.repository.find(
      (l) =>
        l.initiatorUin === initiatorUin &&
        l.groupUin === groupUin &&
        l.date === today
    )
    return existing !== undefined
  }

  async getTodayLottery(
    initiatorUin: number,
    groupUin: number
  ): Promise<Lottery | undefined> {
    const today = Tool.getCurrentDate()
    return await this.repository.find(
      (l) =>
        l.initiatorUin === initiatorUin &&
        l.groupUin === groupUin &&
        l.date === today
    )
  }

  async drawLottery(
    initiatorUin: number,
    groupUin: number,
    availableUins: number[]
  ): Promise<Lottery> {
    // Check if already drawn today
    const existing = await this.getTodayLottery(initiatorUin, groupUin)
    if (existing) {
      return existing
    }

    // Filter out the initiator from available UIns
    const validUins = availableUins.filter((uin) => uin !== initiatorUin)

    if (validUins.length === 0) {
      throw new Error('No valid members to draw from')
    }

    // Random selection
    const randomIndex = Math.floor(Math.random() * validUins.length)
    const selectedUin = validUins[randomIndex]

    // Create new lottery record
    const newLottery: Lottery = {
      initiatorUin,
      groupUin,
      date: Tool.getCurrentDate(),
      selectedUin,
      remainingChances: BotSettings.WifeLotteryChance - 1, // Used one chance
      drawnUins: [selectedUin],
    }

    // Save to repository
    await this.repository.appendOrReplace(
      newLottery,
      (l) =>
        l.initiatorUin === initiatorUin &&
        l.groupUin === groupUin &&
        l.date === Tool.getCurrentDate()
    )

    return newLottery
  }

  async rerollLottery(
    initiatorUin: number,
    groupUin: number,
    availableUins: number[]
  ): Promise<{ success: boolean; lottery?: Lottery; message?: string }> {
    const existing = await this.getTodayLottery(initiatorUin, groupUin)

    if (!existing) {
      return {
        success: false,
        message: `你今天还没有抽过老婆呢！可以输入【${BotSettings.WifeLotteryCommands.join(
          ','
        )} 】来抽取哦~`,
      }
    }

    if (existing.remainingChances <= 0) {
      return { success: false, message: '你今天的重抽次数已经用完了！' }
    }

    // Filter out initiator and already drawn UIns
    const validUins = availableUins.filter(
      (uin) => uin !== initiatorUin && !existing.drawnUins.includes(uin)
    )

    if (validUins.length === 0) {
      return { success: false, message: '群里没有更多成员可以抽了！' }
    }

    // Random selection from remaining members
    const randomIndex = Math.floor(Math.random() * validUins.length)
    const selectedUin = validUins[randomIndex]

    // Update lottery record
    const updatedLottery: Lottery = {
      ...existing,
      selectedUin,
      remainingChances: existing.remainingChances - 1,
      drawnUins: [...existing.drawnUins, selectedUin],
    }

    // Save updated record
    await this.repository.appendOrReplace(
      updatedLottery,
      (l) =>
        l.initiatorUin === initiatorUin &&
        l.groupUin === groupUin &&
        l.date === Tool.getCurrentDate()
    )

    return { success: true, lottery: updatedLottery }
  }
}
