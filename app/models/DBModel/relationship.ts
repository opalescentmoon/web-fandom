import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './User/user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Relationship extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userFollow: number

  @column()
  declare userFollowed: number

  @column.dateTime({ autoCreate: true })
  declare timestamp: DateTime

  @belongsTo(() => User, { foreignKey: 'userFollow' })
  public following!: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'userFollowed' })
  public follower!: BelongsTo<typeof User>
}
