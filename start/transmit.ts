import { ChatService } from '#services/chat_service'
import transmit from '@adonisjs/transmit/services/main'

transmit.authorize<{ id: string }>('chats/:id', async (ctx, { id }) => {
  const user = ctx.auth.user
  if (!user) return false

  const chatserv = new ChatService()
  const isPartic = await chatserv.isParticipant(Number(id), user.userId)

  return isPartic
})
