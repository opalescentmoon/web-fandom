import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import Category from './category.js'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './User/user.js'
import Post from './User/post.js'
import WikiPages from './Wikis/wiki_page.js'

export default class Fandom extends BaseModel {
  @column({ isPrimary: true, columnName: 'fandom_id' })
  declare fandomId: number

  @column({ columnName: 'category_id' })
  declare categoryId: number

  @column({ columnName: 'fandom_name' })
  declare fandomName: string

  @belongsTo(() => Category, { foreignKey: 'categoryId' })
  public category!: BelongsTo<typeof Category>

  @hasMany(() => Post)
  public posts!: HasMany<typeof Post>

  @hasMany(() => WikiPages)
  public wiki!: HasMany<typeof WikiPages>

  @manyToMany(() => User, {
    pivotTable: 'user_fandom',
  })
  public users!: ManyToMany<typeof User>
}
