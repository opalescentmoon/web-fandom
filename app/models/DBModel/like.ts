import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './User/user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Post from './User/post.js'

export default class Like extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @belongsTo(() => User)
  public user!: BelongsTo<typeof User>

  @column()
  declare post_id: number

  @belongsTo(() => Post)
  public post!: BelongsTo<typeof Post>

  @column.dateTime({ autoCreate: true })
  declare timestamp: DateTime
}
