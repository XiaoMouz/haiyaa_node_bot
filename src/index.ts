import { NCWebsocket, Structs } from 'node-napcat-ts'

const bot = new NCWebsocket(
  {
    protocol: 'ws',
    host: '117.72.37.125',
    port: 30001,
    accessToken: '21e89duqd9109',
    throwPromise: true,
    reconnection: {
      enable: true,
      attempts: 10,
      delay: 5000,
    },
  },
  true
)

bot.on('message.private.friend', async (ctx) => {
  console.log('Received private message from friend:', ctx.message)
  await bot.send_private_msg({
    user_id: ctx.sender.user_id,
    message: [
      Structs.text(
        'Hello! I received your message: ' +
          ctx.message
            .map((m) =>
              'text' in m.data && m.data.text ? m.data.text.toString() : ''
            )
            .join('')
      ),
      Structs.reply(ctx.message_id),
    ],
  })
})

await bot.connect().then(() => {
  console.log('Connected to the server!')
})
