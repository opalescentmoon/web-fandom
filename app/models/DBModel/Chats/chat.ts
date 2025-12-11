import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import User from '../User/user.js'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Message from './message.js'

export default class Chat extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'chat_type' })
  declare chatType: string

  @column({ columnName: 'chat_name' })
  declare chatName: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @manyToMany(() => User, {
    pivotTable: 'chat_members',
  })
  public members!: ManyToMany<typeof User>

  @hasMany(() => Message)
  public messages!: HasMany<typeof Message>
}
