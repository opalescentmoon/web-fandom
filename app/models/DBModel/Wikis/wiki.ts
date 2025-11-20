import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '../User/user.js'

export default class Wiki extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fandom_id: number

  @column()
  declare content_id: number

  @column()
  declare title: string

  @column()
  declare current_content: string

  @column()
  declare created_by: number

  @belongsTo(() => User)
  public user!: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
