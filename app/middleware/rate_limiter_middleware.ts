import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

interface RateLimitEntry {
  count: number
  resetTime: number
}

/**
 * In-memory store for tracking request counts per IP
 */

export default class RateLimiterMiddleware {
  private static rateLimitStore = new Map<string, RateLimitEntry>()
  private static cleanupStarted = false

  private readonly maxRequests = 100
  private readonly windowMs = 60 * 1000
  private readonly cleanupInterval = 5 * 60 * 1000

  constructor() {
    if (!RateLimiterMiddleware.cleanupStarted) {
      RateLimiterMiddleware.cleanupStarted = true

      setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of RateLimiterMiddleware.rateLimitStore.entries()) {
          if (entry.resetTime < now) {
            RateLimiterMiddleware.rateLimitStore.delete(key)
          }
        }
      }, this.cleanupInterval)
    }
  }

  private getClientIp(ctx: HttpContext): string {
    return (
      ctx.request.ip() ||
      ctx.request.header('x-forwarded-for')?.split(',')[0] ||
      ctx.request.header('cf-connecting-ip') ||
      'unknown'
    )
  }

  private isRateLimited(ip: string): boolean {
    const now = Date.now()
    const entry = RateLimiterMiddleware.rateLimitStore.get(ip)

    if (!entry || entry.resetTime < now) {
      RateLimiterMiddleware.rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return false
    }

    entry.count++
    return entry.count > this.maxRequests
  }

  async handle(ctx: HttpContext, next: NextFn) {
    const ip = this.getClientIp(ctx)
    const limited = this.isRateLimited(ip)
    const entry = RateLimiterMiddleware.rateLimitStore.get(ip)!

    ctx.response.header('X-RateLimit-Limit', this.maxRequests.toString())
    ctx.response.header(
      'X-RateLimit-Remaining',
      Math.max(0, this.maxRequests - entry.count).toString()
    )
    ctx.response.header('X-RateLimit-Reset', entry.resetTime.toString())

    if (limited) {
      return ctx.response.status(429).json({
        message: 'Too many requests',
        retryAfter: Math.ceil((entry.resetTime - Date.now()) / 1000),
      })
    }

    return next()
  }
}
