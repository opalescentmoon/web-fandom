import Chat from '#models/DBModel/Chats/chat'

export class ChatService {
  public async createChat(participantIds: number[], chatType: string) {
    if (chatType === 'dm' && participantIds.length === 2) {
      const [userA, userB] = participantIds

      const existingChat = await Chat.query()
        .where('chat_type', 'dm')
        .whereHas('members', (q) => q.where('user_id', userA))
        .whereHas('members', (q) => q.where('user_id', userB))
        .first()

      if (existingChat) {
        return existingChat
      }
    }

    const chat = await Chat.create({ chatType })

    await chat.related('members').attach(participantIds)

    return chat
  }

  public async getChatMessages(chatId: number) {
    const chat = await Chat.findOrFail(chatId)
    const messages = await chat.related('messages').query()
    return messages
  }

  public async addParticipant(chatId: number, userId: number) {
    const chat = await Chat.findOrFail(chatId)
    await chat.related('members').attach([userId])
    return chat
  }

  public async removeParticipant(chatId: number, userId: number) {
    const chat = await Chat.findOrFail(chatId)
    await chat.related('members').detach([userId])
    return chat
  }

  public async findChat(chatId: number) {
    return await Chat.findOrFail(chatId)
  }

  public async isParticipant(chatId: number, userId: number) {
    const chat = await Chat.findOrFail(chatId)
    const members = await chat.related('members').query().where('user_id', userId)
    return members.length > 0
  }
}
