import type { NCWebsocket } from 'node-napcat-ts'
import type {
  BotContext,
  CommandDefinition,
  MiddlewareDefinition,
  Plugin,
} from '../types'
import { createContext } from '../types'

/**
 * BotApp - 核心应用类（类似 Nuxt App / H3 App）
 */
export class BotApp {
  private bot!: NCWebsocket
  private middlewares: MiddlewareDefinition[] = []
  private commandList: CommandDefinition[] = []
  private plugins: Plugin[] = []
  private isInitialized = false

  /**
   * 设置 Bot 实例
   */
  setBot(bot: NCWebsocket) {
    this.bot = bot
  }

  /**
   * 获取 Bot 实例
   */
  getBot(): NCWebsocket {
    return this.bot
  }

  /**
   * 注册中间件
   */
  use(middleware: MiddlewareDefinition) {
    this.middlewares.push(middleware)
    // 按优先级排序
    this.middlewares.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
    return this
  }

  /**
   * 注册命令
   */
  command(command: CommandDefinition) {
    this.commandList.push(command)
    return this
  }

  /**
   * 注册多个命令
   */
  commands(commands: CommandDefinition[]) {
    this.commandList.forEach((cmd) => this.command(cmd))
    return this
  }

  /**
   * 注册插件
   */
  plugin(plugin: Plugin) {
    this.plugins.push(plugin)
    return this
  }

  /**
   * 初始化应用（执行所有插件）
   */
  async initialize() {
    if (this.isInitialized) return

    console.log('[App] Initializing plugins...')
    for (const plugin of this.plugins) {
      await plugin({ app: this })
    }

    this.isInitialized = true
    console.log('[App] Initialized successfully')
  }

  /**
   * 处理消息 - 核心处理逻辑
   */
  async handleMessage<T>(rawContext: {
    bot: NCWebsocket
    message: { id: number; text: string; raw: T }
    sender: { id: number; nickname: string }
    group?: { id: number }
  }) {
    // 创建 Context
    const ctx = createContext(rawContext)

    try {
      // 匹配命令
      const matchedCommand = this.matchCommand(ctx.message.text)
      if (matchedCommand) {
        ctx.matched = matchedCommand
      }

      // 执行中间件链 + 命令处理
      await this.executeMiddlewareChain(ctx)
    } catch (error) {
      console.error('[App] Error handling message:', error)
    }
  }

  /**
   * 匹配命令
   */
  private matchCommand(message: string): BotContext['matched'] | undefined {
    for (const cmd of this.commandList) {
      const { match } = cmd

      // 字符串匹配
      if (typeof match === 'string') {
        if (message.trim() === match) {
          return { command: cmd.name, params: {} }
        }
      }

      // 字符串数组匹配
      else if (Array.isArray(match)) {
        if (match.some((m) => message.trim() === m)) {
          return { command: cmd.name, params: {} }
        }
      }

      // 正则匹配
      else if (match instanceof RegExp) {
        const result = match.exec(message)
        if (result) {
          return {
            command: cmd.name,
            params: { matches: result, ...result.groups },
          }
        }
      }

      // 函数匹配
      else if (typeof match === 'function') {
        const result = match(message)
        if (result === true) {
          return { command: cmd.name, params: {} }
        } else if (typeof result === 'object' && result !== null) {
          return { command: cmd.name, params: result.params || {} }
        }
      }
    }

    return undefined
  }

  /**
   * 执行中间件链（洋葱模型）
   */
  private async executeMiddlewareChain(ctx: BotContext) {
    let index = 0

    // 收集需要执行的中间件
    const activeMiddlewares = this.middlewares.filter(
      (mw) => !mw.condition || mw.condition(ctx)
    )

    const next = async (): Promise<void> => {
      // 如果所有中间件都执行完了，执行命令处理
      if (index >= activeMiddlewares.length) {
        // 执行匹配的命令
        if (ctx.matched) {
          const command = this.commandList.find(
            (c) => c.name === ctx.matched!.command
          )
          if (command) {
            await command.handler(ctx)
          }
        }
        return
      }

      const middleware = activeMiddlewares[index++]
      await middleware.handler(ctx, next)
    }

    await next()
  }

  /**
   * 启动应用
   */
  async start() {
    if (!this.bot) {
      throw new Error('Bot instance not set. Call setBot() first.')
    }

    // 初始化
    await this.initialize()

    // 设置事件监听
    this.setupEventListeners()

    // 连接
    await this.bot.connect()
    console.log('[App] Bot connected and running!')
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners() {
    // 群消息
    this.bot.on('message.group.normal', async (raw) => {
      const messageText = raw.message
        .map((m) =>
          'text' in m.data && m.data.text ? m.data.text.toString() : ''
        )
        .join('')
        .trim()

      if (!messageText) return

      await this.handleMessage({
        bot: this.bot,
        message: { id: raw.message_id, text: messageText, raw },
        sender: { id: raw.sender.user_id, nickname: raw.sender.nickname || '' },
        group: { id: raw.group_id },
      })
    })

    // 私聊消息
    this.bot.on('message.private.friend', async (raw) => {
      const messageText = raw.message
        .map((m) =>
          'text' in m.data && m.data.text ? m.data.text.toString() : ''
        )
        .join('')
        .trim()

      await this.handleMessage({
        bot: this.bot,
        message: { id: raw.message_id, text: messageText, raw },
        sender: { id: raw.sender.user_id, nickname: raw.sender.nickname || '' },
      })
    })

    // 生命周期事件
    this.bot.on('meta_event.lifecycle.connect', () => {
      console.log('[App] Bot online!')
    })
  }
}

/**
 * 创建 App 实例 - 工厂函数（类似 createApp）
 */
export function createApp(): BotApp {
  return new BotApp()
}
