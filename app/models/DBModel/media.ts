import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Post from './User/post.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Media extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fileUrl: string

  @column()
  declare mediaType: string

  @column()
  declare postId: number

  @belongsTo(() => Post)
  public post!: BelongsTo<typeof Post>
}
