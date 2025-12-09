import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '../User/user.js'
import Fandom from '../fandom.js'
import Content from '../content.js'

export default class Wiki extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fandomId: number

  @column()
  declare contentId: number

  @column()
  declare title: string

  @column()
  declare createdBy: number

  @column()
  declare content: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare approvedBy: number

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  public userCreated!: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'approvedBy' })
  public userApproved!: BelongsTo<typeof User>

  @belongsTo(() => Fandom, { foreignKey: 'fandomId' })
  public fandom!: BelongsTo<typeof Fandom>

  @belongsTo(() => Content, { foreignKey: 'contentId' })
  public contentRelation!: BelongsTo<typeof Content>
}
