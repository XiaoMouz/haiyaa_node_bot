/**
 * 纯函数工具集
 * 所有函数都是纯函数，无副作用
 */

/**
 * 获取当前日期 YYYY-MM-DD
 */
export function getCurrentDate(): string {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

/**
 * 从 URL 获取图片 Buffer
 */
export async function fetchImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * 格式化字符串模板
 */
export function formatString(template: string, ...args: any[]): string {
  return template.replace(/{(\d+)}/g, (match, index) => {
    const i = parseInt(index)
    return typeof args[i] !== 'undefined' ? args[i].toString() : match
  })
}

/**
 * 随机选择（支持权重）
 */
export function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight

  for (const item of items) {
    random -= item.weight
    if (random <= 0) {
      return item
    }
  }

  return items[0]
}

/**
 * 休眠函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 安全的 JSON 解析
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * 检查是否是今天
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getCurrentDate()
}
