import { HttpContext } from '@adonisjs/core/http'
import { UserService } from '#services/user_service'
import Database from '@adonisjs/lucid/services/db'

export default class UsersController {
  private userService = new UserService()

  public async me({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    return response.ok(user)
  }

  public async joinedFandoms({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const rows = await Database
      .from('user_fandom')
      .join('fandoms', 'fandoms.fandom_id', 'user_fandom.fandom_id')
      .where('user_fandom.user_id', user.userId)
      .select(
        Database.raw('fandoms.fandom_id as "fandomId"'),
        Database.raw('fandoms.fandom_name as "fandomName"')
      )
      .orderBy('fandoms.fandom_name', 'asc')

    return response.ok(rows)
  }

  /**
   * Edit user profile (bio, profile picture)
   */
  public async editProfile({ request, auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.unauthorized({ error: 'Not logged in' })

      const data = request.only(['bio', 'profilePicture'])

      const updated = await this.userService.editProfile(user.userId, data)
      return response.ok(updated)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Update email
   */
  public async updateEmail({ request, auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.unauthorized({ error: 'Not logged in' })

      const { email } = request.only(['email'])

      const updated = await this.userService.updateEmail(user.userId, email)
      return response.ok(updated)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Change password
   */
  public async changePassword({ request, auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.unauthorized({ error: 'Not logged in' })

      const { newPassword } = request.only(['newPassword'])

      await this.userService.changePassword(user.userId, newPassword)
      return response.ok({ message: 'Password updated successfully' })
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Delete user account
   */
  public async deleteUser({ auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.unauthorized({ error: 'Not logged in' })

      const deleted = await this.userService.deleteUser(user.userId)
      return response.ok({ message: 'User deleted', deleted })
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }
}
