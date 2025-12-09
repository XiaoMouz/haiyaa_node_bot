import fs from 'fs/promises'
import path from 'path'

export class JsonRepository<T> {
  private filePath: string

  constructor(filePath: string) {
    this.filePath = filePath
  }

  async load(): Promise<T[]> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.filePath)
      await fs.mkdir(dir, { recursive: true })

      // Try to read the file
      const data = await fs.readFile(this.filePath, 'utf-8')
      return JSON.parse(data) as T[]
    } catch (error: any) {
      // If file doesn't exist, return empty array
      if (error.code === 'ENOENT') {
        return []
      }
      console.error(`Error loading ${this.filePath}:`, error)
      return []
    }
  }

  async save(data: T[]): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.filePath)
      await fs.mkdir(dir, { recursive: true })

      // Write data to file
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      console.error(`Error saving ${this.filePath}:`, error)
      throw error
    }
  }

  async append(item: T): Promise<void> {
    const data = await this.load()
    data.push(item)
    await this.save(data)
  }

  async appendOrReplace(
    item: T,
    predicate: (existing: T) => boolean
  ): Promise<void> {
    const data = await this.load()
    const index = data.findIndex(predicate)

    if (index >= 0) {
      data[index] = item
    } else {
      data.push(item)
    }

    await this.save(data)
  }

  async find(predicate: (item: T) => boolean): Promise<T | undefined> {
    const data = await this.load()
    return data.find(predicate)
  }

  async filter(predicate: (item: T) => boolean): Promise<T[]> {
    const data = await this.load()
    return data.filter(predicate)
  }
}
