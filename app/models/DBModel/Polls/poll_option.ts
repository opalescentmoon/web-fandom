import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Poll from './poll.js'

export default class PollOption extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare pollId: number

  @belongsTo(() => Poll, { foreignKey: 'pollId' })
  public poll!: BelongsTo<typeof Poll>

  @column()
  declare optionText: string
}
