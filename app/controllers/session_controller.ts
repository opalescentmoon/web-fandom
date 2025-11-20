import { HttpContext } from '@adonisjs/core/http'
import User from '#models/DBModel/User/user'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export default class SessionController {
  async store({ request }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    const user = await User.verifyCredentials(email, password)

    if (!user) {
      return { error: 'Invalid credentials' }
    }

    const payload = { sub: user.user_id, email: user.email }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

    return { token, user }
  }
}
