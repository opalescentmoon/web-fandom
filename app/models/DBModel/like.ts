import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './User/user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Post from './User/post.js'

export default class Like extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare postId: number

  @column.dateTime({ autoCreate: true })
  declare timestamp: DateTime

  @belongsTo(() => User)
  public user!: BelongsTo<typeof User>

  @belongsTo(() => Post)
  public post!: BelongsTo<typeof Post>
}
