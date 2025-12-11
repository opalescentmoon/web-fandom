// app/Controllers/Http/MessageController.ts
import { HttpContext } from '@adonisjs/core/http'
import { MessageService } from '#services/message_service'
import { ChatService } from '#services/chat_service'

export default class MessagesController {
  private messageService = new MessageService()
  private chatService = new ChatService()

  /**
   * Send a message
   */
  public async send({ request, auth, response }: HttpContext) {
    const senderId = auth.user!.userId
    const chatId = request.input('chat_id')
    const messageText = request.input('message_text')

    if (!chatId || !messageText) {
      return response.badRequest({ message: 'chat_id and message_text are required' })
    }

    const allowed = await this.chatService.isParticipant(chatId, senderId)
    if (!allowed) {
      return response.forbidden({ message: 'You are not a participant of this chat' })
    }

    const message = await this.messageService.sendMessage(senderId, chatId, messageText)
    return response.created({ message: 'Message sent', data: message })
  }

  /**
   * Edit a message
   */
  public async edit({ params, request, auth, response }: HttpContext) {
    const messageId = Number(params.messageId)
    const newContent = request.input('new_content')
    const userId = auth.user!.userId

    if (!newContent) {
      return response.badRequest({ message: 'new_content is required' })
    }

    const message = await this.messageService.editMessage(messageId, newContent)

    if (message.senderId !== userId) {
      return response.forbidden({ message: 'You can only edit your own messages' })
    }

    return response.ok({ message: 'Message edited', data: message })
  }

  /**
   * Delete a message (soft delete)
   */
  public async delete({ params, auth, response }: HttpContext) {
    const messageId = Number(params.messageId)
    const userId = auth.user!.userId

    const message = await this.messageService.deleteMessage(messageId)

    if (message.senderId !== userId) {
      return response.forbidden({ message: 'You can only delete your own messages' })
    }

    return response.ok({ message: 'Message deleted', data: message })
  }

  /**
   * Get message status (delivered/read/etc.)
   */
  public async status({ params, auth, response }: HttpContext) {
    const messageId = Number(params.messageId)
    const userId = auth.user!.userId

    const message = await this.messageService.getMessageStatus(messageId)
    const chatId = message[0]?.chatId

    if (chatId) {
      const allowed = await this.chatService.isParticipant(chatId, userId)
      if (!allowed) {
        return response.forbidden({ message: 'You are not a participant of this chat' })
      }
    }

    return response.ok({ data: message })
  }

  /**
   * Update message status (delivered/read/failed)
   */
  public async updateStatus({ request, auth, response }: HttpContext) {
    const messageId = request.input('message_id')
    const status = request.input('status')
    const userId = auth.user!.userId

    if (!messageId || !status) {
      return response.badRequest({ message: 'message_id and status are required' })
    }

    const updated = await this.messageService.updateMessageStatus(messageId, userId, status)
    return response.ok({ message: 'Message status updated', data: updated })
  }
}
