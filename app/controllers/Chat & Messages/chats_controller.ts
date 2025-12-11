// app/Controllers/Http/ChatController.ts
import { HttpContext } from '@adonisjs/core/http'
import { ChatService } from '#services/chat_service'

export default class ChatsController {
  private chatService = new ChatService()

  /**
   * Create chat (private or group)
   */
  public async create({ request, auth, response }: HttpContext) {
    const participantIds = request.input('participant_ids')
    const chatType = request.input('chat_type')

    if (!participantIds || !Array.isArray(participantIds)) {
      return response.badRequest({ message: 'participant_ids must be an array' })
    }

    if (!chatType) {
      return response.badRequest({ message: 'chat_type is required' })
    }

    const userId = auth.user!.userId
    if (!participantIds.includes(userId)) {
      participantIds.push(userId)
    }

    const chat = await this.chatService.createChat(participantIds, chatType)
    return response.created({ message: 'Chat created', data: chat })
  }

  /**
   * Get messages (auth required)
   */
  public async messages({ params, auth, response }: HttpContext) {
    const chatId = Number(params.chatId)
    const userId = auth.user!.userId

    const allowed = await this.chatService.isParticipant(chatId, userId)
    if (!allowed) {
      return response.forbidden({ message: 'You are not a participant of this chat' })
    }

    const messages = await this.chatService.getChatMessages(chatId)
    return response.ok({ data: messages })
  }

  /**
   * Add participant (group only)
   */
  public async addParticipant({ params, request, auth, response }: HttpContext) {
    const chatId = Number(params.chatId)
    const userId = request.input('user_id')
    const requesterId = auth.user!.userId

    const allowed = await this.chatService.isParticipant(chatId, requesterId)
    if (!allowed) {
      return response.forbidden({ message: 'You are not a participant of this chat' })
    }

    const chat = await this.chatService.addParticipant(chatId, userId)
    return response.ok({ message: 'Participant added', data: chat })
  }

  /**
   * Remove participant (group only)
   */
  public async removeParticipant({ params, request, auth, response }: HttpContext) {
    const chatId = Number(params.chatId)
    const userId = request.input('user_id')
    const requesterId = auth.user!.userId

    const allowed = await this.chatService.isParticipant(chatId, requesterId)
    if (!allowed) {
      return response.forbidden({ message: 'You are not a participant of this chat' })
    }

    const chat = await this.chatService.removeParticipant(chatId, userId)
    return response.ok({ message: 'Participant removed', data: chat })
  }

  /**
   * Find chat (auth required)
   */
  public async find({ params, auth, response }: HttpContext) {
    const chatId = Number(params.chatId)
    const userId = auth.user!.userId

    const allowed = await this.chatService.isParticipant(chatId, userId)
    if (!allowed) {
      return response.forbidden({ message: 'You are not a participant of this chat' })
    }

    const chat = await this.chatService.findChat(chatId)
    return response.ok({ data: chat })
  }
}
