import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/DBModel/User/user'

export default class SessionController {
  async store({ request, auth, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      const user = await User.verifyCredentials(email, password)

      const token = await auth.use('api').createToken(user)

      return {
        token,
        user: {
          id: user.userId,
          email: user.email,
          username: user.username,
        },
      }
    } catch {
      return response.unauthorized({ error: 'Invalid credentials' })
    }
  }
}
