import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true, columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'user_name' })
  declare username: string

  @column({ columnName: 'display_name' })
  declare displayName: string

  @column({ columnName: 'email' })
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column({ columnName: 'bio' })
  declare bio: string

  @column({ columnName: 'profile_picture' })
  declare profilePicture: URL

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
