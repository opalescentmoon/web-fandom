import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import User from './User/user.js'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Relationship extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_follow' })
  declare userFollow: number

  @column({ columnName: 'user_followed' })
  declare userFollowed: number

  @column.dateTime({ autoCreate: true })
  declare timestamp: DateTime

  @belongsTo(() => User, { foreignKey: 'userFollow' })
  public following!: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'userFollowed' })
  public follower!: BelongsTo<typeof User>

  @manyToMany(() => User, {
    pivotTable: 'relationships',
  })
  public users!: ManyToMany<typeof User>
}
