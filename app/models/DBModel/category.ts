import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import Fandom from './fandom.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Category extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'category' })
  declare category: string

  @hasMany(() => Fandom)
  public fandoms!: HasMany<typeof Fandom>
}
