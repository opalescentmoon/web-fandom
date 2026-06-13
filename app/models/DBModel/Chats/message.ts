import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Media from '../media.js'
import User from '../User/user.js'
import Chat from './chat.js'
import MessageStatus from './message_status.js'

export default class Message extends BaseModel {
  @column({ isPrimary: true, columnName: 'message_id' })
  declare id: number

  @column({ columnName: 'chat_id' })
  declare chatId: number

  @column({ columnName: 'sender_id' })
  declare senderId: number

  @column({ columnName: 'message_text' })
  declare messageText: string

  @column({ columnName: 'media_id' })
  declare mediaId: number | null

  @belongsTo(() => Chat, { foreignKey: 'chatId' })
  public chat!: BelongsTo<typeof Chat>

  @belongsTo(() => Media, { foreignKey: 'mediaId' })
  public media!: BelongsTo<typeof Media>

  @belongsTo(() => User, { foreignKey: 'senderId' })
  public sender!: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ serializeAs: null })
  declare deletedAt: DateTime | null

  @hasMany(() => User)
  public user!: HasMany<typeof User>

  @hasMany(() => MessageStatus, { foreignKey: 'messageId' })
  public statuses!: HasMany<typeof MessageStatus>
}
