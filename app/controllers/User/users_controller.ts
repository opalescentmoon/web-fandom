import { HttpContext } from '@adonisjs/core/http'
import { UserService } from '#services/user_service'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import fs from 'node:fs/promises'
import { join } from 'node:path'
import Database from '@adonisjs/lucid/services/db'
import User from '#models/DBModel/User/user'

export default class UsersController {
  private userService = new UserService()

  public async me({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    return response.ok(user)
  }

  public async getById({ params, response }: HttpContext) {
    try {
      const user = await User.findOrFail(Number(params.userId))
      return response.ok({
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        profilePicture: user.profilePicture,
      })
    } catch (error: any) {
      return response.notFound({ error: 'User not found' })
    }
  }

  public async joinedFandoms({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const rows = await Database.from('user_fandom')
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

      const data = request.only(['displayName', 'bio', 'profilePicture'])

      const updated = await this.userService.editProfile(user.userId, data)
      return response.ok(updated)
    } catch (error: any) {
      return response.badRequest({ error: error.message })
    }
  }

  public async updateProfilePicture({ request, auth, response }: HttpContext) {
    const authUser = auth.user
    if (!authUser) return response.unauthorized({ error: 'Not logged in' })

    const user = await User.findOrFail(authUser.userId)

    await user.refresh()
    console.log('testfile123')

    const file = request.file('avatar', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    })

    if (!file) return response.badRequest({ error: 'No file uploaded' })

    if (user.profilePicture) {
      try {
        const oldFilePath = join(process.cwd(), 'public', user.profilePicture)
        await fs.unlink(oldFilePath)
      } catch (error: any) {
        response.badRequest({ error: error.message })
      }
    }

    const fileName = `${cuid()}.${file.extname}`
    await file.move(app.makePath('public/uploads/avatars'), { name: fileName })

    const profilePicture = `/uploads/avatars/${fileName}`

    const updated = await this.userService.editProfile(user.userId, { profilePicture })
    return response.ok(updated)
  }

  public async updateUsername({ request, auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.unauthorized({ error: 'Not logged in' })

      const { username } = request.only(['username'])

      const updated = await this.userService.updateUsername(user.userId, username)
      return response.ok(updated)
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      return response.badRequest({ error: error.message })
    }
  }

  public async search({ request, response }: HttpContext) {
    const query = request.qs().q

    if (!query) {
      return response.badRequest({ message: 'Search query is required' })
    }

    const users = await User.query()
      .where('user_name', 'ilike', `%${query}%`)
      .orWhere('display_name', 'ilike', `%${query}%`)
      .select(['user_id', 'user_name', 'display_name', 'profile_picture'])
      .limit(10)

    return response.ok({ data: users })
  }
}
