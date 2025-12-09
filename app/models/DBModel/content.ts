import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Content extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contentName: string

  @column()
  declare contentBranch: string
}
