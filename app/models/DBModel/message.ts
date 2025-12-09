import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Media from './media.js'
import User from './User/user.js'
import Chat from './chat.js'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare chatId: number

  @column()
  declare senderId: number

  @column()
  declare messageText: string

  @column()
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
  declare editedAt: DateTime

  @column.dateTime({ serializeAs: null })
  declare deletedAt: DateTime | null
}
