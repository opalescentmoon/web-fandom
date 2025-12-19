import type { HttpContext } from '@adonisjs/core/http'
import { PostService } from '#services/post_service'

export default class SearchController {
  private postService = new PostService()

  public async index({ request, response }: HttpContext) {
    try {
      const fandomId = Number(request.input('fandomId'))
      const q = String(request.input('q') || '').trim().replace(/^#/, '')
      const tab = String(request.input('tab') || '')
      const branch = String(request.input('branch') || '')

      if (!Number.isFinite(fandomId) || !q) {
        return response.ok([])
      }

      const posts = await this.postService.searchByHashtag({
        fandomId,
        q,
        tab: tab || undefined,
        branch: branch || undefined,
      })

      return response.ok(posts)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }
}
