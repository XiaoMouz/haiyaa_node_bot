import 'dotenv/config'
import { BotService } from './Service/BotService.js'
import { LiveMonitorService } from './Service/LiveMonitorService.js'

async function main() {
  try {
    console.log('='.repeat(50))
    console.log('Haiyaa Bot Starting...')
    console.log('='.repeat(50))

    // Get configuration from environment variables
    const config = {
      protocol: (process.env.BOT_PROTOCOL as 'ws' | 'wss') || 'ws',
      host: process.env.BOT_HOST || '127.0.0.1',
      port: parseInt(process.env.BOT_PORT || '3001'),
      accessToken: process.env.BOT_ACCESS_TOKEN,
    }

    console.log('[Main] Bot configuration:')
    console.log(`  Protocol: ${config.protocol}`)
    console.log(`  Host: ${config.host}`)
    console.log(`  Port: ${config.port}`)
    console.log(`  Access Token: ${config.accessToken ? '***' : 'Not set'}`)

    // Initialize bot service
    const botService = new BotService(config)
    await botService.initialize()

    // Connect to server
    await botService.connect()

    // Initialize and start live monitor
    const liveMonitor = new LiveMonitorService(botService.getBot())
    await liveMonitor.start()

    console.log('='.repeat(50))
    console.log('Bot is now running!')
    console.log('Press Ctrl+C to stop')
    console.log('='.repeat(50))

    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\n[Main] Shutting down...')
      liveMonitor.stop()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      console.log('\n[Main] Shutting down...')
      liveMonitor.stop()
      process.exit(0)
    })
  } catch (error) {
    console.error('[Main] Fatal error:', error)
    process.exit(1)
  }
}

main()
