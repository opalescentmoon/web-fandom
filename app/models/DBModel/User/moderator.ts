import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Fandom from '../fandom.js'

export default class Moderator extends BaseModel {
  @column({ isPrimary: true, columnName: 'mod_id' })
  declare modId: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'fandom_id' })
  declare fandomId: number

  @belongsTo(() => User, { foreignKey: 'userId' })
  public user!: BelongsTo<typeof User>

  @belongsTo(() => Fandom, { foreignKey: 'fandomId' })
  public fandom!: BelongsTo<typeof Fandom>

  @manyToMany(() => User, {
    pivotTable: 'moderators',
  })
  public users!: ManyToMany<typeof User>

  @column.dateTime({ autoCreate: true, columnName: 'assigned_at' })
  declare assignedAt: DateTime
}
