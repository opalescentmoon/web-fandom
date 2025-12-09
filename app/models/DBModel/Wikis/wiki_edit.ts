import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from '../User/user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Wiki from './wiki_page.js'

export default class WikiEdit extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare pageId: number

  @column()
  declare editorId: number

  @column()
  declare status: string

  @column()
  declare reviewedBy: string

  @column()
  declare content: string

  @column.dateTime({ autoCreate: true })
  declare reviewedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  public editor!: BelongsTo<typeof User>

  @belongsTo(() => Wiki, { foreignKey: 'id' })
  public wikiId!: BelongsTo<typeof Wiki>
}
