import WikiPages from '#models/DBModel/Wikis/wiki_page'
import WikiEdit from '#models/DBModel/Wikis/wiki_edit'
import Media from '#models/DBModel/media'
import { MediaService } from './media_service.js'

export class WikiService {
  public async createWiki(userId: number, fandomId: number, contentId: number, title: string) {
    let wiki = await WikiPages.create({ fandomId, contentId, createdBy: userId, title })
    return wiki
  }

  public async addWikiPage(wikiId: number, content: string, userId: number) {
    let wikiPage = await WikiEdit.create({
      pageId: wikiId,
      content,
      editorId: userId,
      status: 'Pending',
    })
    return wikiPage
  }

  public async editWikiPage(wikiId: number, content: string, editorId: number) {
    let wikiPage = await WikiEdit.create({ pageId: wikiId, content, editorId, status: 'pending' })
    return wikiPage
  }

  public async approveWikiEdit(editId: number, reviewerId: number) {
    const wikiEdit = await WikiEdit.findOrFail(editId)
    wikiEdit.status = 'approved'
    wikiEdit.reviewedBy = reviewerId.toString()
    await wikiEdit.save()

    const wikiPage = await WikiPages.findOrFail(wikiEdit.pageId)
    wikiPage.content = wikiEdit.content
    wikiPage.approvedBy = reviewerId
    await wikiPage.save()

    return wikiEdit
  }

  public async rejectWikiEdit(editId: number, reviewerId: number) {
    const wikiEdit = await WikiEdit.findOrFail(editId)
    wikiEdit.status = 'rejected'
    wikiEdit.reviewedBy = reviewerId.toString()
    await wikiEdit.save()
    return wikiEdit
  }

  public async deleteWiki(wikiId: number, userId: number) {
    const wikiPage = await WikiPages.findOrFail(wikiId)
    if (wikiPage.createdBy !== userId) {
      throw new Error('Unauthorized')
    }
    await wikiPage.delete()
    return wikiPage
  }

  public async getWikiPage(wikiId: number) {
    const wikiPage = await WikiPages.findOrFail(wikiId)
    
    // get latest approved edit as current content
    const latestEdit = await WikiEdit.query()
      .where('page_id', wikiId)
      .orderBy('created_at', 'desc')
      .first()

    return {
      ...wikiPage.toJSON(),
      content: latestEdit?.content ?? null,
    }
  }

  public async getWikiEditsForPage(wikiId: number) {
    const wikiEdits = await WikiEdit.query().where('page_id', wikiId)
    return wikiEdits
  }

  public async addHashtagsToWiki(wikiId: number, hashtagId: number) {
    const wikipage = await WikiPages.findOrFail(wikiId)
    await wikipage.related('hashtags').attach([hashtagId])
    await wikipage.load('hashtags')
    return wikipage
  }

  public async removeHashtagsFromWiki(wikiId: number, hashtagId: number) {
    const wikipage = await WikiPages.findOrFail(wikiId)
    await wikipage.related('hashtags').detach([hashtagId])
    await wikipage.load('hashtags')
    return wikipage
  }

  public async getWikisWithHashtag(hashtagId: number) {
    const wikipage = await WikiPages.query().whereHas('hashtags', (query) => {
      query.where('hashtag_id', hashtagId)
    })
    return wikipage
  }

  public async searchByHashtag({
    fandomId,
    q,
    branch,
  }: {
    fandomId: number
    q: string
    branch?: string
  }) {
    const key = String(q || '')
      .replace(/^#/, '')
      .trim()
      .toLowerCase()
    if (!key) return []

    const query = WikiPages.query()
      .where('wiki_pages.fandom_id', fandomId)

      .join('hashtag_wikis', 'hashtag_wikiss.wiki_id', 'wiki_pages.id')
      .join('hashtags', 'hashtags.id', 'hashtag_wikis.hashtag_id')
      .join('contents', 'contents.content_id', 'posts.content_id')
      .whereRaw('LOWER(hashtags.hashtag_name) = ?', [key])
      .distinct('wiki_pages.id')
      .select('wiki_pages.*', 'contents.content_branch as contentBranch')
      .preload('hashtags')
      .preload('userCreator', (u) => {
        u.select(['user_id', 'user_name', 'display_name', 'profile_picture'])
      })
      .orderBy('wiki_pages.created_at', 'desc')

    if (branch) {
      query.where('contents.content_branch', branch)
    }

    const wikipage = await query

    return wikipage.map((p) => ({
      ...p.serialize(),
      ...p.$extras,
    }))
  }

  public async addMediaToWiki(wikiId: number, mediaUrl: string, mediaType: string) {
    const media = await Media.create({ wikiId, fileUrl: mediaUrl, mediaType })
    return media
  }

  public async getMediaForWiki(wikiId: number) {
    const mediaItems = await Media.query().where('post_id', wikiId)
    return mediaItems
  }

  public async removeMediaFromWiki(wikiId: number, mediaId: number) {
    const wikipage = await WikiPages.findOrFail(wikiId)
    await wikipage.load('media')

    const media = wikipage.media.find((m) => m.id === mediaId)
    if (!media) {
      throw new Error('Media not found for this wiki.')
    }

    await MediaService.delete(mediaId)
  }
}
