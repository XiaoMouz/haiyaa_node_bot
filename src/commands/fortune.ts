import { defineCommand } from '../types'
import { useFortune } from '../composables'
import { sendImage } from '../utils'

/**
 * Fortune Command - 运势命令
 * 类似 API Route: /api/fortune
 */
export default defineCommand({
  name: 'fortune',
  description: '抽取今日运势',

  // 匹配多个命令别名
  match: ['运势', '今日运势', 'ys'],

  async handler(ctx) {
    const { getTodayFortune, drawFortune } = useFortune()

    try {
      // 只在群聊中有效
      if (!ctx.group) {
        return
      }

      // 检查今日是否已抽过
      const existing = await getTodayFortune(ctx.sender.id, ctx.group.id)

      let fortune
      let isNewDraw = false

      if (existing) {
        fortune = existing
      } else {
        fortune = await drawFortune(ctx.sender.id, ctx.group.id)
        isNewDraw = true
      }

      // 配置（后续可移到配置文件）
      const ASSETS_PATH = process.env.ASSETS_PATH || 'src/Assets'
      const FORTUNE_IMAGES: Record<string, string> = {
        大吉: `${ASSETS_PATH}/大吉.png`,
        小吉: `${ASSETS_PATH}/小吉.png`,
        末吉: `${ASSETS_PATH}/末吉.png`,
        平: `${ASSETS_PATH}/平.png`,
        小凶: `${ASSETS_PATH}/小凶.png`,
        大凶: `${ASSETS_PATH}/大凶.png`,
      }

      const imagePath = FORTUNE_IMAGES[fortune.fortuneType]
      const text = isNewDraw
        ? `你今天的运势是：${fortune.fortuneType}`
        : `你今天已经抽过运势了哦，是：${fortune.fortuneType}`

      await sendImage(ctx, imagePath, text, true)

      console.log(
        `[Fortune] ${ctx.sender.id} drew ${fortune.fortuneType} (new: ${isNewDraw})`
      )
    } catch (error) {
      console.error(
        `[Fortune] Error (sender ${ctx.sender.nickname} | ${ctx.sender.id}):`,
        error
      )
      const { reply } = await import('../utils')
      await reply(ctx, '抽运势时出错了，请稍后再试~')
    }
  },
})
