import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthMiddleware {
  public async handle(ctx: HttpContext, next: NextFn) {
    // IMPORTANT: ctx.auth MUST exist after initialize_auth_middleware
    // If it doesn't, we throw a clear error instead of "undefined.authenticate"
    if (!ctx.auth) {
      ctx.logger.error('ctx.auth is undefined. Check that initialize_auth_middleware runs before auth middleware.')
      return ctx.response.status(500).json({ error: 'Auth not initialized (ctx.auth missing)' })
    }

    try {
      await ctx.auth.authenticate()
    } catch {
      // Return JSON if request expects JSON
      const accept = ctx.request.header('accept') || ''
      const contentType = ctx.request.header('content-type') || ''
      const wantsJson =
        accept.includes('application/json') || contentType.includes('application/json')

      if (wantsJson) {
        return ctx.response.unauthorized({ error: 'Unauthorized' })
      }

      return ctx.response.redirect('/login')
    }

    return next()
  }
}
