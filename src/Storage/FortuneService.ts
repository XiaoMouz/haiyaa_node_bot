import { JsonRepository } from '../Util/JsonRepository.js'
import { BotSettings } from '../Config/BotSettings.js'
import { Fortune, FortuneMeta } from './Fortune.js'
import { Tool } from '../Util/Tool.js'

export class FortuneService {
  private repository: JsonRepository<Fortune>
  private metaRepository: JsonRepository<FortuneMeta>

  constructor() {
    this.repository = new JsonRepository<Fortune>(BotSettings.FortuneDataFilePath)
    this.metaRepository = new JsonRepository<FortuneMeta>(BotSettings.FortuneMetaDataFilePath)
  }

  async initialize(): Promise<void> {
    // Check if fortune meta data exists
    const metaData = await this.metaRepository.load()

    if (metaData.length === 0) {
      // Initialize with default fortune types
      const defaultFortunes: FortuneMeta[] = [
        { name: '大吉', weight: 1 },
        { name: '小吉', weight: 2 },
        { name: '末吉', weight: 3 },
        { name: '平', weight: 3 },
        { name: '小凶', weight: 2 },
        { name: '大凶', weight: 1 },
      ]
      await this.metaRepository.save(defaultFortunes)
      console.log('Fortune meta data initialized')
    }
  }

  async hasDrawnToday(uin: number, groupUin: number): Promise<boolean> {
    const today = Tool.getCurrentDate()
    const existing = await this.repository.find(
      (f) => f.uin === uin && f.groupUin === groupUin && f.date === today
    )
    return existing !== undefined
  }

  async getTodayFortune(uin: number, groupUin: number): Promise<Fortune | undefined> {
    const today = Tool.getCurrentDate()
    return await this.repository.find(
      (f) => f.uin === uin && f.groupUin === groupUin && f.date === today
    )
  }

  async drawFortune(uin: number, groupUin: number): Promise<Fortune> {
    // Check if already drawn today
    const existing = await this.getTodayFortune(uin, groupUin)
    if (existing) {
      return existing
    }

    // Get fortune types and weights
    const fortuneTypes = await this.metaRepository.load()

    // Calculate total weight
    const totalWeight = fortuneTypes.reduce((sum, f) => sum + f.weight, 0)

    // Random selection based on weight
    let random = Math.random() * totalWeight
    let selectedFortune = fortuneTypes[0].name

    for (const fortune of fortuneTypes) {
      random -= fortune.weight
      if (random <= 0) {
        selectedFortune = fortune.name
        break
      }
    }

    // Create new fortune record
    const newFortune: Fortune = {
      uin,
      groupUin,
      date: Tool.getCurrentDate(),
      fortuneType: selectedFortune,
    }

    // Save to repository
    await this.repository.append(newFortune)

    return newFortune
  }
}
