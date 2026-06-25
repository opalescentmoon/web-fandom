import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import User from '../User/user.js'
import Fandom from '../fandom.js'
import Content from '../content.js'
import Hashtag from '../hashtag.js'
import Media from '../media.js'

export default class WikiPages extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'fandom_id' })
  declare fandomId: number

  @column({ columnName: 'content_id' })
  declare contentId: number

  @column({ columnName: 'title' })
  declare title: string

  @column({ columnName: 'created_by' })
  declare createdBy: number

  @column({ columnName: 'content' })
  declare content: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column({ columnName: 'approved_by' })
  declare approvedBy: number

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  public userCreator!: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'approvedBy' })
  public userApproved!: BelongsTo<typeof User>

  @belongsTo(() => Fandom, { foreignKey: 'fandomId' })
  public fandom!: BelongsTo<typeof Fandom>

  @belongsTo(() => Content, { foreignKey: 'contentId' })
  public contentRelation!: BelongsTo<typeof Content>

  @hasMany(() => Media, { foreignKey: 'id' })
  declare media: HasMany<typeof Media>

  @manyToMany(() => Hashtag, {
    pivotTable: 'hashtag_wikis',
    pivotForeignKey: 'wiki_id',
    pivotRelatedForeignKey: 'hashtag_id',

    localKey: 'id',
    relatedKey: 'id',
  })
  public hashtags!: ManyToMany<typeof Hashtag>
}
