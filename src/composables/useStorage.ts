import fs from 'fs/promises'
import path from 'path'

/**
 * useStorage - 类似 Nuxt useStorage 的 composable
 * 提供简单的 JSON 文件存储功能
 */
export function useStorage<T>(filePath: string) {
  /**
   * 加载数据
   */
  async function load(): Promise<T[]> {
    try {
      const dir = path.dirname(filePath)
      await fs.mkdir(dir, { recursive: true })

      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data) as T[]
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        return []
      }
      throw error
    }
  }

  /**
   * 保存数据
   */
  async function save(data: T[]): Promise<void> {
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  /**
   * 追加数据
   */
  async function append(item: T): Promise<void> {
    const data = await load()
    data.push(item)
    await save(data)
  }

  /**
   * 查找单个
   */
  async function find(predicate: (item: T) => boolean): Promise<T | undefined> {
    const data = await load()
    return data.find(predicate)
  }

  /**
   * 查找多个
   */
  async function filter(predicate: (item: T) => boolean): Promise<T[]> {
    const data = await load()
    return data.filter(predicate)
  }

  /**
   * 更新或追加
   */
  async function upsert(
    item: T,
    predicate: (existing: T) => boolean
  ): Promise<void> {
    const data = await load()
    const index = data.findIndex(predicate)

    if (index >= 0) {
      data[index] = item
    } else {
      data.push(item)
    }

    await save(data)
  }

  return {
    load,
    save,
    append,
    find,
    filter,
    upsert,
  }
}
