import Message from '#models/DBModel/Chats/message'
import MessageStatus from '#models/DBModel/Chats/message_status'
import { DateTime } from 'luxon'

export class MessageService {
  public async sendMessage(senderId: number, chatId: number, messageText: string) {
    let message = await Message.create({ senderId, chatId, messageText })
    return message
  }

  public async editMessage(messageId: number, newContent: string) {
    const message = await Message.findOrFail(messageId)
    message.messageText = newContent
    await message.save()
    return message
  }

  public async deleteMessage(messageId: number) {
    const message = await Message.findOrFail(messageId)
    message.deletedAt = DateTime.now()
    await message.save()
    return message
  }

  public async getMessageStatus(messageId: number) {
    const message = await Message.findOrFail(messageId)
    const messageStatus = await MessageStatus.query().where('message_id', message.id)
    return messageStatus
  }

  public async updateMessageStatus(messageId: number, userId: number, status: string) {
    let messageStatus = await MessageStatus.query()
      .where('message_id', messageId)
      .andWhere('user_id', userId)
      .first()

    if (!messageStatus) {
      messageStatus = new MessageStatus()
      messageStatus.messageId = messageId
      messageStatus.userId = userId
      messageStatus.status = status
      messageStatus.sentAt = DateTime.now()
    } else {
      messageStatus.status = status
      if (status === 'delivered') {
        messageStatus.deliveredAt = DateTime.now()
      } else if (status === 'read') {
        messageStatus.readAt = DateTime.now()
      } else if (status === 'failed') {
        messageStatus.failedAt = DateTime.now()
        messageStatus.retryCount += 1
      }
    }

    await messageStatus.save()
    return messageStatus
  }
}
