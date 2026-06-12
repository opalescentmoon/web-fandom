import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class TransmitAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const token = ctx.request.input('token')

    if (!token) {
      return ctx.response.unauthorized({ error: 'Authentication token missing' })
    }

    try {
      await ctx.auth.use('api').authenticateAsClient(token)
    } catch (error: any) {
      return ctx.response.unauthorized({ error: 'invalid or expired token' })
    }

    const output = await next()
    return output
  }
}
