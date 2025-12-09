import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Category from './category.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Fandom extends BaseModel {
  @column({ isPrimary: true })
  declare fandomId: number

  @column()
  declare categoryId: number

  @column()
  declare fandomName: string

  @belongsTo(() => Category, { foreignKey: 'categoryId' })
  public category!: BelongsTo<typeof Category>
}
