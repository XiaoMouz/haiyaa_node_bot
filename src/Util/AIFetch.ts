import OpenAI from 'openai'

export class AIFetch {
  private static client: OpenAI | null = null

  static getClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set in environment variables')
      }

      this.client = new OpenAI({
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      })
    }

    return this.client
  }

  static async generateResponse(prompt: string): Promise<string> {
    try {
      const client = this.getClient()
      const model = process.env.OPENAI_MODEL || 'gpt-4o'

      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 200,
      })

      return completion.choices[0]?.message?.content?.trim() || ''
    } catch (error) {
      console.error('Error generating AI response:', error)
      throw error
    }
  }
}
