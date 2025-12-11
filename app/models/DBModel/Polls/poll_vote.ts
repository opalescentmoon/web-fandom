import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import PollOption from './poll_option.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/DBModel/User/user'

export default class PollVote extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'poll_option_id' })
  declare pollOptionId: number

  @belongsTo(() => PollOption, { foreignKey: 'pollOptionId' })
  public pollOption!: BelongsTo<typeof PollOption>

  @column({ columnName: 'user_id' })
  declare userId: number

  @belongsTo(() => User, { foreignKey: 'userId' })
  public user!: BelongsTo<typeof User>
}
