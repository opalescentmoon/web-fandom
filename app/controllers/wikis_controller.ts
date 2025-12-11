import type { HttpContext } from '@adonisjs/core/http'
import { WikiService } from '#services/wiki_service'

export default class WikisController {
  private wikiService = new WikiService()

  /**
   * Create a new wiki page
   * POST /api/wikis
   */
  async createWiki({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user!
      const { fandomId, contentId, title } = request.only(['fandomId', 'contentId', 'title'])

      const wiki = await this.wikiService.createWiki(user.userId, fandomId, contentId, title)

      return response.status(201).json({
        success: true,
        message: 'Wiki page created successfully',
        data: wiki,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to create wiki page',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Add a new wiki page revision/edit
   * POST /api/wikis/:wikiId/edits
   */
  async addWikiPage({ params, request, response }: HttpContext) {
    try {
      const { wikiId } = params
      const { content } = request.only(['content'])

      const wikiPage = await this.wikiService.addWikiPage(Number.parseInt(wikiId), content)

      return response.status(201).json({
        success: true,
        message: 'Wiki page revision added successfully',
        data: wikiPage,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to add wiki page revision',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Edit a wiki page (create pending edit)
   * POST /api/wikis/:wikiId/edit
   */
  async editWikiPage({ auth, params, request, response }: HttpContext) {
    try {
      const user = auth.user!
      const { wikiId } = params
      const { content } = request.only(['content'])

      const wikiPage = await this.wikiService.editWikiPage(
        Number.parseInt(wikiId),
        content,
        user.userId
      )

      return response.status(201).json({
        success: true,
        message: 'Wiki edit submitted for review',
        data: wikiPage,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to edit wiki page',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Approve a wiki edit
   * POST /api/wikis/edits/:editId/approve
   */
  async approveWikiEdit({ auth, params, response }: HttpContext) {
    try {
      const user = auth.user!
      const { editId } = params

      const wikiEdit = await this.wikiService.approveWikiEdit(Number.parseInt(editId), user.userId)

      return response.status(200).json({
        success: true,
        message: 'Wiki edit approved successfully',
        data: wikiEdit,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to approve wiki edit',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Reject a wiki edit
   * POST /api/wikis/edits/:editId/reject
   */
  async rejectWikiEdit({ auth, params, response }: HttpContext) {
    try {
      const user = auth.user!
      const { editId } = params

      const wikiEdit = await this.wikiService.rejectWikiEdit(Number.parseInt(editId), user.userId)

      return response.status(200).json({
        success: true,
        message: 'Wiki edit rejected',
        data: wikiEdit,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to reject wiki edit',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Delete a wiki page
   * DELETE /api/wikis/:wikiId
   */
  async deleteWiki({ auth, params, response }: HttpContext) {
    try {
      const user = auth.user!
      const { wikiId } = params

      const wiki = await this.wikiService.deleteWiki(Number.parseInt(wikiId), user.userId)

      return response.status(200).json({
        success: true,
        message: 'Wiki page deleted successfully',
        data: wiki,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to delete wiki page',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Get a wiki page
   * GET /api/wikis/:wikiId
   */
  async getWikiPage({ params, response }: HttpContext) {
    try {
      const { wikiId } = params

      const wiki = await this.wikiService.getWikiPage(Number.parseInt(wikiId))

      return response.status(200).json({
        success: true,
        data: wiki,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch wiki page',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Get all edits for a wiki page
   * GET /api/wikis/:wikiId/edits
   */
  async getWikiEditsForPage({ params, response }: HttpContext) {
    try {
      const { wikiId } = params

      const edits = await this.wikiService.getWikiEditsForPage(Number.parseInt(wikiId))

      return response.status(200).json({
        success: true,
        data: edits,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch wiki edits',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
