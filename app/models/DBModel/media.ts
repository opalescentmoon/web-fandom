import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Post from './User/post.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Media extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'file_url' })
  declare fileUrl: string

  @column({ columnName: 'media_type' })
  declare mediaType: string

  @column({ columnName: 'post_id' })
  declare postId: number

  @belongsTo(() => Post, { foreignKey: 'postId' })
  public post!: BelongsTo<typeof Post>
}
