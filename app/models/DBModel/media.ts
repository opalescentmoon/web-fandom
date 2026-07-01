import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Post from '#models/DBModel/User/post'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import WikiPages from './Wikis/wiki_page.js'

export default class Media extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'file_url' })
  declare fileUrl: string

  @column({ columnName: 'media_type' })
  declare mediaType: string

  @column({ columnName: 'post_id' })
  declare postId: number

  @column({ columnName: 'wiki_id' })
  declare wikiId: number

  @belongsTo(() => Post, { foreignKey: 'postId' })
  declare post: BelongsTo<typeof Post>

  @belongsTo(() => WikiPages, { foreignKey: 'wikiId' })
  declare wiki: BelongsTo<typeof WikiPages>
}
