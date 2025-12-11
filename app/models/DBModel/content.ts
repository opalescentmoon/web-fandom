import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import Post from './User/post.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import WikiPages from './Wikis/wiki_page.js'

export default class Content extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'content_name' })
  declare contentName: string

  @column({ columnName: 'content_branch' })
  declare contentBranch: string

  @hasMany(() => Post)
  public posts!: HasMany<typeof Post>

  @hasMany(() => WikiPages)
  public wikiPage!: HasMany<typeof WikiPages>
}
