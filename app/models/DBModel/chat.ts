import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Chat extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare chatType: string

  @column()
  declare chatName: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
