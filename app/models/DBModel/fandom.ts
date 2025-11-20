import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Fandom extends BaseModel {
  @column({ isPrimary: true })
  declare fandom_id: number

  @column()
  declare fandom_name: string
}
