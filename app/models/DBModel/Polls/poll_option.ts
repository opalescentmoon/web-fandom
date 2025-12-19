import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Poll from './poll.js'
import PollVote from './poll_vote.js'

export default class PollOption extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'poll_id' })
  declare pollId: number

  @belongsTo(() => Poll, { foreignKey: 'pollId' })
  public poll!: BelongsTo<typeof Poll>

  @column({ columnName: 'option_text' })
  declare optionText: string

  @hasMany(() => PollVote, { foreignKey: 'pollOptionId' })
  public votes!: HasMany<typeof PollVote>
}
