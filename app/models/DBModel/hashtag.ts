import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Post from './User/post.js'

export default class Hashtag extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'hashtag_name' })
  declare hashtagName: string

  @manyToMany(() => Post, {
    pivotTable: 'hashtag_posts',
    pivotForeignKey: 'hashtag_id',
  pivotRelatedForeignKey: 'post_id',

    localKey: 'id',
    relatedKey: 'postId',
  })
  public posts!: ManyToMany<typeof Post>
}
