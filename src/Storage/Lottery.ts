export interface Lottery {
  initiatorUin: number // Person who initiated the lottery
  groupUin: number // Group ID
  date: string // YYYY-MM-DD
  selectedUin: number // The "wife" that was selected
  remainingChances: number // Remaining re-roll chances
  drawnUins: number[] // All UIns that have been drawn (to prevent duplicates on re-roll)
}
