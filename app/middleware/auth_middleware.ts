import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    // Attempt authentication using specified guards or default
    const isAuthenticated = await this.authenticate(ctx, options.guards)

    if (!isAuthenticated) {
      // Check if this is an API request or web request
      if (this.isApiRequest(ctx)) {
        return ctx.response.status(401).json({
          success: false,
          message: 'Unauthorized - Please provide a valid authentication token',
          error: 'UNAUTHENTICATED',
        })
      }

      // Redirect web requests to login page
      return ctx.response.redirect(this.redirectTo)
    }

    // User is authenticated, proceed to next middleware/route
    return next()
  }

  /**
   * Attempt to authenticate the user
   */
  private async authenticate(
    ctx: HttpContext,
    guards?: (keyof Authenticators)[]
  ): Promise<boolean> {
    try {
      // Use specified guards or default guard
      await ctx.auth.authenticateUsing(guards, { loginRoute: this.redirectTo })
      return !!ctx.auth.user
    } catch (error) {
      return false
    }
  }

  /**
   * Determine if the request is an API request
   */
  private isApiRequest(ctx: HttpContext): boolean {
    // Check Accept header for JSON
    const accept = ctx.request.header('accept') || ''
    if (accept.includes('application/json')) {
      return true
    }

    // Check if path starts with /api
    if (ctx.request.url().startsWith('/api') || ctx.request.url().startsWith('/auth')) {
      return true
    }

    // Check Content-Type header
    const contentType = ctx.request.header('content-type') || ''
    if (contentType.includes('application/json')) {
      return true
    }

    return false
  }
}
