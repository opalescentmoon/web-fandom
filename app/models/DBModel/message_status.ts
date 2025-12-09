import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Message from './message.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './User/user.js'

export default class MessageStatus extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare messageId: number

  @column()
  declare userId: number

  @column()
  declare status: string

  @column.dateTime({ autoCreate: true })
  declare sentAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare deliveredAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare readAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare failedAt: DateTime

  @column()
  declare retryCount: number

  @belongsTo(() => Message, { foreignKey: 'messageId' })
  public message!: BelongsTo<typeof Message>

  @belongsTo(() => User, { foreignKey: 'userId' })
  public user!: BelongsTo<typeof User>
}
