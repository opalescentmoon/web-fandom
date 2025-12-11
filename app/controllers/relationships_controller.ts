// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { RelationshipService } from '#services/relationship_service'

export default class RelationshipsController {
  private relationshipService = new RelationshipService()

  /**
   * Follow a user (find or create)
   */
  public async follow({ request, auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.unauthorized({ error: 'Not logged in' })

      const { userFollowed } = request.only(['userFollowed'])

      const relationship = await this.relationshipService.findOrCreateRelationship(
        userFollowed,
        user.userId
      )

      return response.ok(relationship)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Unfollow a user
   */
  public async unfollow({ request, auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.unauthorized({ error: 'Not logged in' })

      const { userFollowed } = request.only(['userFollowed'])

      const removed = await this.relationshipService.removeRelationship(userFollowed, user.userId)

      return response.ok({ success: removed })
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Toggle follow/unfollow
   */
  public async toggle({ request, auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.unauthorized({ error: 'Not logged in' })

      const { userFollowed } = request.only(['userFollowed'])

      const result = await this.relationshipService.toggleRelationship(userFollowed, user.userId)

      return response.ok(result)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Count followers of a user
   */
  public async followers({ request, response }: HttpContext) {
    try {
      const { userId } = request.only(['userId'])
      const total = await this.relationshipService.countFollowers(userId)
      return response.ok({ total })
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Count how many users someone is following
   */
  public async following({ request, response }: HttpContext) {
    try {
      const { userId } = request.only(['userId'])
      const total = await this.relationshipService.countFollowing(userId)
      return response.ok({ total })
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }
}
