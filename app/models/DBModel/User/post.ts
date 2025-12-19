import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Fandom from '#models/DBModel/fandom'
import Media from '#models/DBModel/media'
import Content from '../content.js'
import Like from '../like.js'
import Hashtag from '../hashtag.js'

export default class Post extends BaseModel {
  @column({ isPrimary: true, columnName: 'post_id' })
  declare postId: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'fandom_id' })
  declare fandomId: number

  @column({ columnName: 'content_id' })
  declare contentId: number

  @column({ columnName: 'post_type' })
  declare postType: string

  @column({ columnName: 'parent_id' })
  declare parentId: number | null

  @column({ columnName: 'caption' })
  declare caption: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  public user!: BelongsTo<typeof User>

  @belongsTo(() => Fandom, { foreignKey: 'fandomId' })
  public fandom!: BelongsTo<typeof Fandom>

  @belongsTo(() => Content, { foreignKey: 'contentId' })
  public content!: BelongsTo<typeof Content>

  @belongsTo(() => Post, { foreignKey: 'parent_id' })
  public comment!: BelongsTo<typeof Post>

  @hasMany(() => Media, { foreignKey: 'postId' })
  declare media: HasMany<typeof Media>

  @hasMany(() => Like, { foreignKey: 'id' })
  public like!: HasMany<typeof Like>

  @hasMany(() => Post, { foreignKey: 'parent_id' })
  public parent!: HasMany<typeof Post>

  @manyToMany(() => Hashtag, {
    pivotTable: 'hashtag_posts',
    pivotForeignKey: 'post_id',
    pivotRelatedForeignKey: 'hashtag_id',

    localKey: 'postId',               // PK in posts table
    relatedKey: 'id',                  // PK in hashtags table
  })
  public hashtags!: ManyToMany<typeof Hashtag>
}
