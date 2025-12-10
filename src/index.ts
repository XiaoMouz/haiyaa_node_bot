import 'dotenv/config'
import { NCWebsocket } from 'node-napcat-ts'
import { createApp } from './app/app'

// Import commands
import fortuneCommand from './commands/fortune'
import lotteryCommand from './commands/lottery'
import rerollCommand from './commands/reroll'

// Import middleware
import blacklistMiddleware from './middleware/blacklist'
import loggerMiddleware from './middleware/logger'

// Import plugins
import fortuneInitPlugin from './plugins/fortune-init'
import liveMonitorPlugin from './plugins/live-monitor'

/**
 * Main entry point
 */
async function main() {
  try {
    console.log('='.repeat(50))
    console.log('Haiyaa Bot Starting... (Modern Architecture)')
    console.log('='.repeat(50))

    // Create bot instance
    const bot = new NCWebsocket(
      {
        protocol: (process.env.BOT_PROTOCOL as 'ws' | 'wss') || 'ws',
        host: process.env.BOT_HOST || '127.0.0.1',
        port: parseInt(process.env.BOT_PORT || '3001'),
        accessToken: process.env.BOT_ACCESS_TOKEN,
        throwPromise: true,
        reconnection: {
          enable: true,
          attempts: 10,
          delay: 5000,
        },
      },
      process.env.NODE_ENV === 'development'
    )

    // Create app
    const app = createApp()

    // Set bot instance
    app.setBot(bot)

    // Register middleware (执行顺序: 按priority从小到大)
    app.use(loggerMiddleware)
    app.use(blacklistMiddleware)

    // Register commands (类似注册 API routes)
    app.commands([fortuneCommand, lotteryCommand, rerollCommand])
    // Register plugins (插件会在初始化时执行)
    app.plugin(fortuneInitPlugin)
    app.plugin(liveMonitorPlugin)

    // Start app
    await app.start()

    console.log('='.repeat(50))
    console.log('Bot is now running!')
    console.log('Press Ctrl+C to stop')
    console.log('='.repeat(50))

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n[Main] Shutting down...')
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      console.log('\n[Main] Shutting down...')
      process.exit(0)
    })
  } catch (error) {
    console.error('[Main] Fatal error:', error)
    process.exit(1)
  }
}

main()
