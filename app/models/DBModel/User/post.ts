import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Fandom from '#models/DBModel/fandom'
import Media from '#models/DBModel/media'

export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @belongsTo(() => User)
  public user!: BelongsTo<typeof User>

  @column()
  declare fandomId: number

  @column()
  declare contentId: number

  @column()
  declare postType: string

  @column()
  declare parentId: number

  @column()
  declare caption: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Fandom)
  public fandom!: BelongsTo<typeof Fandom>

  @hasMany(() => Media)
  public media!: HasMany<typeof Media>
}
