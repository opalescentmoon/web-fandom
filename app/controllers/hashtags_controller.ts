import { HttpContext } from '@adonisjs/core/http'
import { HashtagService } from '#services/hashtag_service'

export default class HashtagsController {
  private hashtagService = new HashtagService()

  /**
   * Find or create a hashtag
   */
  public async findOrCreate({ request, response }: HttpContext) {
    try {
      const { tag } = request.only(['tag'])
      const hashtag = await this.hashtagService.findOrCreateHashtag(tag)
      return response.ok(hashtag)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Get hashtag by name
   */
  public async getByName({ request, response }: HttpContext) {
    try {
      const { tag } = request.only(['tag'])
      const hashtag = await this.hashtagService.getHashtagByName(tag)
      return response.ok(hashtag)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Get all hashtags
   */
  public async getAll({ response }: HttpContext) {
    try {
      const hashtags = await this.hashtagService.getAllHashtags()
      return response.ok(hashtags)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }
}
