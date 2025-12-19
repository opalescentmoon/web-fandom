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

  /**
   * trending hashtags
   */
  public async trending({ request, response }: HttpContext) {
    try {
      const fandomId = Number(request.input('fandomId'))
      const limit = Math.min(Number(request.input('limit') || 5), 20)

      if (!Number.isFinite(fandomId)) return response.ok([])

      const result = await this.hashtagService.getTrendingByFandom(fandomId, limit)
      return response.ok(result)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Get hashtags used in a specific branch
   */
  public async usedInBranch({ request, response }: HttpContext) {
    try {
      const fandomId = Number(request.input('fandomId'))
      const branch = String(request.input('branch') || '').trim()   // Lore / World
      if (!fandomId || !branch) return response.badRequest({ error: 'fandomId and branch are required' })

      const tags = await this.hashtagService.usedInBranch({ fandomId, branch })
      return response.ok(tags)
    } catch (e) {
      return response.internalServerError({ error: e.message })
    }
  }

}
