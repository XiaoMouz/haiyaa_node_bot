export class Tool {
  /**
   * Serialize object to JSON string
   */
  static toJson(obj: any): string {
    return JSON.stringify(obj, null, 2)
  }

  /**
   * Deserialize JSON string to object
   */
  static fromJson<T>(json: string): T {
    return JSON.parse(json) as T
  }

  /**
   * Fetch image from URL as Buffer
   */
  static async fetchImageAsync(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error('Error fetching image:', error)
      throw error
    }
  }

  /**
   * Get current date in YYYY-MM-DD format
   */
  static getCurrentDate(): string {
    const now = new Date()
    return now.toISOString().split('T')[0]
  }

  /**
   * Format string (simple implementation of C# string.Format)
   */
  static formatString(template: string, ...args: any[]): string {
    return template.replace(/{(\d+)}/g, (match, index) => {
      const i = parseInt(index)
      return typeof args[i] !== 'undefined' ? args[i].toString() : match
    })
  }
}
