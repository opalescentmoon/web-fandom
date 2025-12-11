import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Post from '#models/DBModel/User/post'
import PollOption from './poll_option.js'

export default class Poll extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'post_id' })
  declare postId: number

  @belongsTo(() => Post, { foreignKey: 'id' })
  public post!: BelongsTo<typeof Post>

  @hasMany(() => PollOption)
  public pollOption!: HasMany<typeof PollOption>
}
