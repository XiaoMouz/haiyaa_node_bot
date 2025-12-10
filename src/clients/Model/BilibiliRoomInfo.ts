export type BilibiliRoomInfoResponse = {
  code: number
  msg: string
  message: string
  data: BilibiliRoomData
}

export type BilibiliRoomData = {
  uid: number
  room_id: number
  short_id: number
  attention: number
  online: number
  is_portrait: boolean
  description: string
  live_status: number // 0 = offline, 1 = live, 2 = round
  area_id: number
  parent_area_id: number
  parent_area_name: string
  old_area_id: number
  background: string
  title: string
  user_cover: string
  keyframe: string
  is_strict_room: boolean
  live_time: string
  tags: string
  is_anchor: number
  room_silent_type: string
  room_silent_level: number
  room_silent_second: number
  area_name: string
  pendants: string
  area_pendants: string
  hot_words: string[]
  hot_words_status: number
  verify: string
  new_pendants: unknown
  up_session: string
  pk_status: number
  pk_id: number
  battle_id: number
  allow_change_area_time: number
  allow_upload_cover_time: number
  studio_room_id: number
}
