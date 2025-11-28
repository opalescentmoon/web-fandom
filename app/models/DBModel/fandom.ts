import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Fandom extends BaseModel {
  @column({ isPrimary: true })
  declare fandomId: number

  @column()
  declare categoryId: number

  @column()
  declare fandomName: string
}
