export interface Fortune {
  uin: number // User ID
  groupUin: number // Group ID
  date: string // YYYY-MM-DD
  fortuneType: string // 大吉, 小吉, 末吉, 平, 小凶, 大凶
}

export interface FortuneMeta {
  name: string
  weight: number
}
