import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './User/user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Relationship extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_follow: number

  @column()
  declare user_followed: number

  @belongsTo(() => User)
  public user!: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare timestamp: DateTime
}
