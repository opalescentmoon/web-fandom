import type { HttpContext } from '@adonisjs/core/http'
import { LikeService } from '../services/like_service.js'

export default class LikesController {
  private service = new LikeService()

  /**
   * Create/add a like. Expects `userId` and `postId` in the request body.
   */
  public async store({ request, auth }: HttpContext) {
    const userId = auth.user!.userId
    const postId = request.input('post_id')

    return await this.service.addLike(userId, postId)
  }

  public async destroy({ request, auth }: HttpContext) {
    const userId = auth.user!.userId
    const postId = request.input('post_id')

    return { removed: await this.service.removeLike(userId, postId) }
  }

  public async toggle({ request, auth }: HttpContext) {
    const userId = auth.user!.userId
    const postId = request.input('post_id')

    return await this.service.toggleLike(userId, postId)
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
