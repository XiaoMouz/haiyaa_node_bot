import { NCWebsocket } from 'node-napcat-ts'
import { BotEventHandler } from '../Handle/BotEventHandler.js'
import { MessageService } from './MessageService.js'
import { FortuneService } from '../Storage/FortuneService.js'
import { LotteryService } from '../Storage/LotteryService.js'
import { FortuneHandler } from '../Handle/FortuneHandler.js'
import { LotteryHandler } from '../Handle/LotteryHandler.js'
import { BlacklistHandler } from '../Handle/BlacklistHandler.js'

export interface BotConfig {
  protocol: 'ws' | 'wss'
  host: string
  port: number
  accessToken?: string
}

export class BotService {
  private bot: NCWebsocket
  private eventHandler: BotEventHandler
  private fortuneService: FortuneService
  private lotteryService: LotteryService

  constructor(config: BotConfig) {
    // Initialize bot
    this.bot = new NCWebsocket(
      {
        protocol: config.protocol,
        host: config.host,
        port: config.port,
        accessToken: config.accessToken,
        throwPromise: true,
        reconnection: {
          enable: true,
          attempts: 10,
          delay: 5000,
        },
      },
      process.env.NODE_ENV === 'development'
    )

    // Initialize services
    this.fortuneService = new FortuneService()
    this.lotteryService = new LotteryService()

    // Initialize handlers
    const fortuneHandler = new FortuneHandler(this.fortuneService)
    const lotteryHandler = new LotteryHandler(this.lotteryService)
    const blacklistHandler = new BlacklistHandler()

    // Initialize message service
    const messageService = new MessageService(
      fortuneHandler,
      lotteryHandler,
      blacklistHandler
    )

    // Initialize event handler
    this.eventHandler = new BotEventHandler(messageService)

    console.log('[BotService] Bot initialized')
  }

  async initialize(): Promise<void> {
    // Initialize fortune meta data
    await this.fortuneService.initialize()
    console.log('[BotService] Services initialized')
  }

  async connect(): Promise<void> {
    // Setup event handlers
    this.eventHandler.setupEventHandlers(this.bot)

    // Connect to server
    await this.bot.connect()
    console.log('[BotService] Bot connected')
  }

  getBot(): NCWebsocket {
    return this.bot
  }
}
