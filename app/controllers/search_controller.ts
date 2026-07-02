import type { HttpContext } from '@adonisjs/core/http'
import { PostService } from '#services/post_service'
import WikiPages from '#models/DBModel/Wikis/wiki_page'
import db from '@adonisjs/lucid/services/db'

export default class SearchController {
  private postService = new PostService()

  public async index({ request, response }: HttpContext) {
    try {
      const fandomId = Number(request.input('fandomId'))
      const q = String(request.input('q') || '')
        .trim()
        .replace(/^#/, '')
      const tab = String(request.input('tab') || '')
      const branch = String(request.input('branch') || '')

      if (!Number.isFinite(fandomId) || !q) {
        return response.ok([])
      }

      // Official tab — fetch posts + wikis
      if (tab === 'official') {
        const key = q.toLowerCase()

        // find hashtag id
        const hashtag = await db
          .from('hashtags')
          .whereRaw('LOWER(hashtag_name) = ?', [key])
          .first()

        if (!hashtag) return response.ok([])

        const hashtagId = hashtag.id

        // fetch announcement posts (branch filter optional)
        let announcementPosts: any[] = []
        if (!branch || branch === 'Announcement') {
          announcementPosts = await this.postService.searchByHashtag({
            fandomId,
            q,
            tab: 'official',
            branch: 'Announcement',
          })
        }

        // fetch wiki pages by hashtag
        let wikis: any[] = []
        if (!branch || branch === 'Lore' || branch === 'Worldbuilding') {
          const wikiQuery = WikiPages.query()
            .where('fandom_id', fandomId)
            .join('hashtag_wikis', 'hashtag_wikis.wiki_id', 'wiki_pages.id')
            .where('hashtag_wikis.hashtag_id', hashtagId)
            .preload('hashtags')

          if (branch === 'Lore') wikiQuery.where('content_id', 5)
          if (branch === 'Worldbuilding') wikiQuery.where('content_id', 6)

          const wikiResults = await wikiQuery
          wikis = wikiResults.map(w => ({
            ...w.serialize(),
            __type: 'wiki',
          }))
        }

        // combine and sort by createdAt
        const combined = [
          ...announcementPosts.map(p => ({ ...p, __type: 'post' })),
          ...wikis,
        ].sort((a, b) => new Date(b.createdAt ?? b.created_at).getTime() - new Date(a.createdAt ?? a.created_at).getTime())

        return response.ok(combined)
      }

      // other tabs — existing logic
      const posts = await this.postService.searchByHashtag({
        fandomId,
        q,
        tab: tab || undefined,
        branch: branch || undefined,
      })

      return response.ok(posts)
    } catch (error: any) {
      return response.badRequest({ error: error.message })
    }
  }
}
