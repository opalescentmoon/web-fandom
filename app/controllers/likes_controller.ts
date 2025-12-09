import type { HttpContext } from '@adonisjs/core/http'
import { LikeService } from '../services/like_service.js'

export default class LikesController {
  private service = new LikeService()

  /**
   * Create/add a like. Expects `userId` and `postId` in the request body.
   */
  public async store({ request }: HttpContext) {
    const { userId, postId } = request.only(['userId', 'postId'])
    const like = await this.service.addLike(Number(userId), Number(postId))
    return like
  }

  /**
   * Remove a like. Expects `userId` and `postId` in the request body.
   */
  public async destroy({ request }: HttpContext) {
    const { userId, postId } = request.only(['userId', 'postId'])
    const removed = await this.service.removeLike(Number(userId), Number(postId))
    return { removed }
  }

  /**
   * Toggle like state for a user on a post. Expects `userId` and `postId` in body.
   */
  public async toggle({ request }: HttpContext) {
    const { userId, postId } = request.only(['userId', 'postId'])
    const result = await this.service.toggleLike(Number(userId), Number(postId))
    return result
  }

  /**
   * Return like count for a post. Expects `postId` as route param.
   */
  public async count({ params }: HttpContext) {
    const postId = Number(params.postId)
    const total = await this.service.countLikes(postId)
    return { total }
  }
}
