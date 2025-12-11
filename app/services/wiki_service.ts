import WikiPages from '#models/DBModel/Wikis/wiki_page'
import WikiEdit from '#models/DBModel/Wikis/wiki_edit'

export class WikiService {
  public async createWiki(userId: number, fandomId: number, contentId: number, title: string) {
    let wiki = await WikiPages.create({ fandomId, contentId, createdBy: userId, title })
    return wiki
  }

  public async addWikiPage(wikiId: number, content: string) {
    let wikiPage = await WikiEdit.create({
      pageId: wikiId,
      content,
      editorId: 0,
      status: 'pending',
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
    return wikiPage
  }

  public async getWikiEditsForPage(wikiId: number) {
    const wikiEdits = await WikiEdit.query().where('page_id', wikiId)
    return wikiEdits
  }
}
