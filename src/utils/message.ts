import { Structs } from 'node-napcat-ts'
import type { BotContext } from '../types'
import fs from 'fs/promises'

/**
 * 发送文本消息
 */
export async function sendText(ctx: BotContext, text: string, reply = true) {
  if (!ctx.group) {
    // 私聊
    return ctx.bot.send_private_msg({
      user_id: ctx.sender.id,
      message: [Structs.text(text)],
    })
  }

  // 群消息
  const message = reply
    ? [Structs.reply(ctx.message.id), Structs.text(text)]
    : [Structs.text(text)]

  return ctx.bot.send_group_msg({
    group_id: ctx.group.id,
    message,
  })
}

/**
 * 发送图片消息
 */
export async function sendImage(
  ctx: BotContext,
  imagePath: string,
  text?: string,
  reply = true
) {
  let imageSegment

  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('base64')
  ) {
    // 网络图片或 base64 图片
    imageSegment = Structs.image(imagePath)
  } else {
    const imageBuffer = await fs.readFile(imagePath)
    const base64Image = imageBuffer.toString('base64')
    imageSegment = Structs.image(`base64://${base64Image}`)
  }

  if (!ctx.group) {
    // 私聊
    const message = text ? [Structs.text(text), imageSegment] : [imageSegment]
    return ctx.bot.send_private_msg({
      user_id: ctx.sender.id,
      message,
    })
  }

  // 群消息
  const message = []
  if (reply) message.push(Structs.reply(ctx.message.id))
  if (text) message.push(Structs.text(text))
  message.push(imageSegment)

  return ctx.bot.send_group_msg({
    group_id: ctx.group.id,
    message,
  })
}

/**
 * 发送 @ 消息
 */
export async function sendAt(
  ctx: BotContext,
  text: string,
  userId: number | 'all'
) {
  if (!ctx.group) return

  const message = [
    Structs.at(userId === 'all' ? 'all' : userId),
    Structs.text(` ${text}`),
  ]

  return ctx.bot.send_group_msg({
    group_id: ctx.group.id,
    message,
  })
}

/**
 * 回复消息（快捷方法）
 */
export async function reply(ctx: BotContext, text: string) {
  return sendText(ctx, text, true)
}
