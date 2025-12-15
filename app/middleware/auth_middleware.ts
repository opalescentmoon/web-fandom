import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthMiddleware {
  public async handle(ctx: HttpContext, next: NextFn) {
    console.log('AUTH HEADER →', ctx.request.header('authorization'))

    if (!ctx.auth) {
      ctx.logger.error(
        'ctx.auth is undefined. Check that initialize_auth_middleware runs before auth middleware.'
      )
      return ctx.response.status(500).json({ error: 'Auth not initialized (ctx.auth missing)' })
    }

    try {
      await ctx.auth.authenticateUsing(['api'])
    } catch (error) {
      console.log('AUTH ERROR →', error)
      return ctx.response.unauthorized({ error: 'Unauthorized' })
    }

    return next()
  }
}
