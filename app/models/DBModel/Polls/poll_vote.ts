import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import PollOption from './poll_option.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/DBModel/User/user'

export default class PollVote extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare poll_option_id: number

  @belongsTo(() => PollOption)
  public poll_option!: BelongsTo<typeof PollOption>

  @column()
  declare user_id: number

  @belongsTo(() => User)
  public user!: BelongsTo<typeof User>
}
