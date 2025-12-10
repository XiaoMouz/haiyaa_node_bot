import { definePlugin } from '../types'
import { useFortune } from '../composables'

/**
 * Fortune Init Plugin - 初始化运势系统
 */
export default definePlugin(async ({ app }) => {
  console.log('[Plugin:Fortune] Initializing fortune system...')

  const { initialize } = useFortune()
  await initialize()

  console.log('[Plugin:Fortune] Fortune system initialized')
})
