export class BotSettings {
  // Blacklist configuration
  static readonly BlacklistedUins = [1079163675, 2498480278]
  static readonly MonitoredGroupUinsForBlacklist = [1167613390, 521409608]

  // Fortune commands
  static readonly FortuneCommands = ['运势', '今日运势', 'ys']

  // Wife lottery commands
  static readonly WifeLotteryCommands = ['抽老婆', '今日老婆', 'lp']
  static readonly RerollCommands = ['再抽一次', 'clp']
  static readonly WifeLotteryChance = 2

  // Checkin commands (not yet implemented)
  static readonly CheckinCommands = ['签到', '今日签到']

  // AI Prompt for blacklist reply
  static readonly BlacklistReplyPromptFormat = `你不需要描述任何前后文，直接返回内容即可。
请你扮演一个网友，用讽刺、挖苦的语气回复以下消息。
要求：
1. 语气要尖酸刻薄，但不要太过分
2. 可以适当使用网络用语
3. 保持简短，1-2句话即可
4. 不要有任何礼貌用语

消息内容：{0}`

  // Data storage paths
  static readonly LotteryDataFilePath = 'Data/lottery_records.json'
  static readonly FortuneDataFilePath = 'Data/fortune_records.json'
  static readonly FortuneMetaDataFilePath = 'Data/fortune_meta.json'
  static readonly CheckinDataFilePath = 'Data/checkin_records.json'

  // Bilibili live room monitoring
  static readonly LiveRoomId = parseInt(process.env.BILIBILI_LIVE_ROOM_ID || '22601574')
  static readonly NotifyFansGroupUin = parseInt(process.env.BILIBILI_NOTIFY_GROUP_UIN || '749823895')
  static readonly BilibiliPollIntervalMs = parseInt(process.env.BILIBILI_POLL_INTERVAL_MS || '30000')

  // Assets paths
  static readonly AssetsPath = 'src/Assets'
  static readonly MaoImagePath = `${BotSettings.AssetsPath}/mao.jpg`

  // Fortune image paths
  static readonly FortuneImages = {
    大吉: `${BotSettings.AssetsPath}/大吉.png`,
    小吉: `${BotSettings.AssetsPath}/小吉.png`,
    末吉: `${BotSettings.AssetsPath}/末吉.png`,
    平: `${BotSettings.AssetsPath}/平.png`,
    小凶: `${BotSettings.AssetsPath}/小凶.png`,
    大凶: `${BotSettings.AssetsPath}/大凶.png`,
  }

  // Private message default response
  static readonly PrivateMessageDefaultText = '小BOT不是很理解哦，因为还没有做私聊捏'
}
