import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Message from './message.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '../User/user.js'

export default class MessageStatus extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'chat_id' })
  declare chatId: number

  @column({ columnName: 'message_id' })
  declare messageId: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column()
  declare status: string

  @column.dateTime({ autoCreate: true, columnName: 'sent_at' })
  declare sentAt: DateTime

  @column.dateTime({ autoCreate: true, columnName: 'delivered_at' })
  declare deliveredAt: DateTime

  @column.dateTime({ autoCreate: true, columnName: 'read_at' })
  declare readAt: DateTime

  @column.dateTime({ autoCreate: true, columnName: 'failed_at' })
  declare failedAt: DateTime

  @column({ columnName: 'retry_count' })
  declare retryCount: number

  @belongsTo(() => Message, { foreignKey: 'messageId' })
  public message!: BelongsTo<typeof Message>

  @belongsTo(() => User, { foreignKey: 'userId' })
  public user!: BelongsTo<typeof User>
}
