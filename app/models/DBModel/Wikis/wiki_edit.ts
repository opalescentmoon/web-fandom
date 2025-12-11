import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from '../User/user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import WikiPages from './wiki_page.js'

export default class WikiEdit extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'page_id' })
  declare pageId: number

  @column({ columnName: 'editor_id' })
  declare editorId: number

  @column({ columnName: 'status' })
  declare status: string

  @column({ columnName: 'reviewed_by' })
  declare reviewedBy: string

  @column({ columnName: 'content' })
  declare content: string

  @column.dateTime({ autoCreate: true, columnName: 'reviewed_at' })
  declare reviewedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  public editor!: BelongsTo<typeof User>

  @belongsTo(() => WikiPages, { foreignKey: 'id' })
  public wikiId!: BelongsTo<typeof WikiPages>
}
