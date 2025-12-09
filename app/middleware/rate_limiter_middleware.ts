import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

interface RateLimitEntry {
  count: number
  resetTime: number
}

/**
 * In-memory store for tracking request counts per IP
 */
const rateLimitStore = new Map<string, RateLimitEntry>()

export default class RateLimiterMiddleware {
  /**
   * Rate limit configuration
   * Adjust these values based on your requirements
   */
  private readonly maxRequests = 100 // Maximum requests allowed
  private readonly windowMs = 60 * 1000 // Time window in milliseconds (60 seconds)
  private readonly skipSuccessfulRequests = false // Count all requests
  private readonly skipFailedRequests = false // Count failed requests too
  private readonly cleanupInterval = 5 * 60 * 1000 // Cleanup old entries every 5 minutes

  constructor() {
    // Cleanup old entries periodically
    setInterval(() => {
      this.cleanupStore()
    }, this.cleanupInterval)
  }

  /**
   * Get client IP address
   */
  private getClientIp(ctx: HttpContext): string {
    return (
      ctx.request.ip() ||
      ctx.request.header('x-forwarded-for')?.split(',')[0] ||
      ctx.request.header('cf-connecting-ip') ||
      'unknown'
    )
  }

  /**
   * Clean up expired entries from the store
   */
  private cleanupStore(): void {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }

  /**
   * Check if a request should be rate limited
   */
  private isRateLimited(clientIp: string): boolean {
    const now = Date.now()
    const entry = rateLimitStore.get(clientIp)

    if (!entry) {
      // First request from this IP
      rateLimitStore.set(clientIp, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return false
    }

    // Check if the window has expired
    if (entry.resetTime < now) {
      // Reset the counter
      rateLimitStore.set(clientIp, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return false
    }

    // Increment counter
    entry.count++

    // Check if limit is exceeded
    return entry.count > this.maxRequests
  }

  /**
   * Get remaining requests for a client
   */
  private getRemainingRequests(clientIp: string): number {
    const entry = rateLimitStore.get(clientIp)
    if (!entry) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - entry.count)
  }

  /**
   * Get reset time for a client
   */
  private getResetTime(clientIp: string): number {
    const entry = rateLimitStore.get(clientIp)
    if (!entry) {
      return Date.now() + this.windowMs
    }
    return entry.resetTime
  }

  async handle(ctx: HttpContext, next: NextFn) {
    const clientIp = this.getClientIp(ctx)
    const isLimited = this.isRateLimited(clientIp)
    const remaining = this.getRemainingRequests(clientIp)
    const resetTime = this.getResetTime(clientIp)

    // Add rate limit headers to response
    ctx.response.header('X-RateLimit-Limit', this.maxRequests.toString())
    ctx.response.header('X-RateLimit-Remaining', remaining.toString())
    ctx.response.header('X-RateLimit-Reset', resetTime.toString())

    // If rate limited, return 429 error
    if (isLimited) {
      return ctx.response.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      })
    }

    // Call next middleware/route handler
    const output = await next()
    return output
  }
}
