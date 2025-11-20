import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Fandom from '#models/DBModel/fandom'

export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @belongsTo(() => User)
  public user!: BelongsTo<typeof User>

  @column()
  declare fandom_id: number

  @belongsTo(() => Fandom)
  public fandom!: BelongsTo<typeof Fandom>

  @column()
  declare content_id: number

  @column()
  declare post_type: string

  @column()
  declare parent_id: number

  @column()
  declare caption: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
