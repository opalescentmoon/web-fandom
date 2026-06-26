import type { HttpContext } from '@adonisjs/core/http'
import { WikiService } from '#services/wiki_service'
import { ModService } from '#services/mod_service'
import { cuid } from '@adonisjs/core/helpers'
import Media from '#models/DBModel/media'
import fs from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import { inject } from '@adonisjs/core'
import WikiPages from '#models/DBModel/Wikis/wiki_page'

@inject()
@inject()
export default class WikisController {
  constructor(
    protected wikiService: WikiService,
    protected modService: ModService
  ) {}

  /**
   * Create a new wiki page
   * POST /api/wikis
   */
  public async createWiki({ auth, request, response }: HttpContext) {
    try {
      await auth.authenticate()
      const userId = auth.user!.userId
      const { fandomId, contentId, title } = request.only(['fandomId', 'contentId', 'title'])

      const isMod = await this.modService.checkMod(userId, fandomId)

      if (!isMod) {
        return response.forbidden({
          success: false,
          message: 'Only moderators can create wiki pages',
        })
      }

      const wiki = await this.wikiService.createWiki(userId, fandomId, contentId, title)

      return response.created({
        success: true,
        message: 'Wiki page created successfully',
        data: wiki,
      })
    } catch (error) {
      return response.internalServerError({
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
  public async addWikiPage({ auth, params, request, response }: HttpContext) {
    try {
      await auth.authenticate()
      const userId = auth.user!.userId
      const { fandomId } = request.only(['fandomId'])
      const { wikiId } = params
      const { content } = request.only(['content'])

      const isMod = await this.modService.checkMod(userId, fandomId)

      if (!isMod) {
        return response.forbidden({
          success: false,
          message: 'Only moderators can revise wiki pages',
        })
      }

      const wikiPage = await this.wikiService.addWikiPage(Number.parseInt(wikiId), content, userId)

      return response.created({
        success: true,
        message: 'Wiki page revision added successfully',
        data: wikiPage,
      })
    } catch (error) {
      return response.internalServerError({
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
  public async editWikiPage({ auth, params, request, response }: HttpContext) {
    try {
      await auth.authenticate()
const userId = auth.user!.userId
      const { wikiId } = params
      const { content } = request.only(['content'])

      const wikiPage = await this.wikiService.editWikiPage(Number.parseInt(wikiId), content, userId)

      return response.created({
        success: true,
        message: 'Wiki edit submitted for review',
        data: wikiPage,
      })
    } catch (error) {
      return response.internalServerError({
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
  public async approveWikiEdit({ auth, params, request, response }: HttpContext) {
    try {
      await auth.authenticate()
      const userId = auth.user!.userId
      const fandomId = Number(request.input('fandomId'))
      const { editId } = params

      const isMod = await this.modService.checkMod(userId, fandomId)

      if (!isMod) {
        return response.forbidden({
          success: false,
          message: 'Only moderators can create wiki pages',
        })
      }

      const wikiEdit = await this.wikiService.approveWikiEdit(Number.parseInt(editId), userId)

      return response.created({
        success: true,
        message: 'Wiki edit approved successfully',
        data: wikiEdit,
      })
    } catch (error) {
      return response.internalServerError({
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
  public async rejectWikiEdit({ auth, params, request, response }: HttpContext) {
    try {
      await auth.authenticate()
      const userId = auth.user!.userId
      const fandomId = Number(request.input('fandomId'))
      const { editId } = params

      const isMod = await this.modService.checkMod(userId, fandomId)

      if (!isMod) {
        return response.forbidden({
          success: false,
          message: 'Only moderators can create wiki pages',
        })
      }

      const wikiEdit = await this.wikiService.rejectWikiEdit(Number.parseInt(editId), userId)

      return response.created({
        success: true,
        message: 'Wiki edit rejected',
        data: wikiEdit,
      })
    } catch (error) {
      return response.internalServerError({
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
  public async deleteWiki({ auth, params, response }: HttpContext) {
    try {
      await auth.authenticate()
const userId = auth.user!.userId
      const fandomId = Number(params.fandomId)
      const { wikiId } = params

      const isMod = await this.modService.checkMod(userId, fandomId)

      if (!isMod) {
        return response.forbidden({
          success: false,
          message: 'Only moderators can create wiki pages',
        })
      }

      const wiki = await this.wikiService.deleteWiki(Number.parseInt(wikiId), userId)

      return response.ok({
        success: true,
        message: 'Wiki page deleted successfully',
        data: wiki,
      })
    } catch (error) {
      return response.internalServerError({
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
  public async getWikiPage({ params, response }: HttpContext) {
    try {
      const { wikiId } = params

      const wiki = await this.wikiService.getWikiPage(Number.parseInt(wikiId))

      return response.ok({
        success: true,
        data: wiki,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch wiki page',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
 * Get all wiki pages for a fandom
 * GET /api/wikis/fandom/:fandomId
 */
public async getWikisByFandom({ request, params, response }: HttpContext) {
    try {
      const { fandomId } = params
      const contentId = request.input('contentId')

      const query = WikiPages.query().where('fandom_id', fandomId)

      if (contentId) {
        query.andWhere('content_id', contentId)
      }

      const wikis = await query.orderBy('created_at', 'desc')

      return response.ok({
        success: true,
        data: wikis,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch wiki pages',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Get all edits for a wiki page
   * GET /api/wikis/:wikiId/edits
   */
  public async getWikiEditsForPage({ params, response }: HttpContext) {
    try {
      const { wikiId } = params

      const edits = await this.wikiService.getWikiEditsForPage(Number.parseInt(wikiId))

      return response.ok({
        success: true,
        data: edits,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch wiki edits',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  public async addMedia({ request, auth, response }: HttpContext) {
    try {
      let uploadedFile: any = null
      const wikiId = Number(request.input('wikiId'))
      const fandomId = Number(request.input('fandomId'))
      if (!wikiId || !fandomId) return response.badRequest({ error: 'Invalid wikiId or fandomId' })

      const file = request.file('media', {
        size: '500mb',
        extnames: ['jpg', 'jpeg', 'png'],
      })

      if (!file || !file.isValid) {
        if (file && file.tmpPath) {
          try {
            await fs.unlink(file.tmpPath)
          } catch (err: any) {
            console.error('Failed to remove temp file:', err.message)
          }
        }
        return response.badRequest({
          message: 'Invalid file type. Only JPG, JPEG, and PNG are allowed.',
        })
      }

      const fileName = `${cuid()}.${file.extname}`
      const uploadDir = app.makePath('public/images/media_assets')

      uploadedFile = file
      await file.move(uploadDir, { name: fileName })

      if (!file.isValid) {
        return response.badRequest({ error: file.errors })
      }

      // Determine type
      const mediaType = file.type === 'video' ? 'video' : 'image'

      // Public URL path stored in DB
      const fileUrl = `/images/media_assets/${fileName}`

      try {
        const media = await Media.create({ fileUrl, mediaType })
        const user = auth.user!

        const isMod = await this.modService.checkMod(user.userId, fandomId)

        if (isMod) {
          const result = await this.wikiService.addMediaToWiki(
            wikiId,
            media.fileUrl,
            media.mediaType
          )
          return response.ok({ status: 'approved', data: result, media })
        } else {
          const suggestion = await this.wikiService.editWikiPage(
            wikiId,
            JSON.stringify({
              action: 'ADD_MEDIA',
              mediaId: media.id,
              fileUrl: media.fileUrl,
            }),
            user.userId
          )

          return response.created({
            status: 'pending',
            message: 'Your addition has been submitted as an edit suggestion.',
            data: suggestion,
          })
        }
      } catch (error: any) {
        if (uploadedFile?.filePath) {
          await fs.unlink(uploadedFile.filePath).catch(() => {})
        }
        return response.internalServerError({ error: error.message })
      }
    } catch (error: any) {
      return response.internalServerError({ error: error.message })
    }
  }

  /**
   * Remove media
   */
  public async removeMedia({ request, auth, response }: HttpContext) {
    try {
      const wikiId = Number(request.input('wikiId'))
      const mediaId = Number(request.input('mediaId'))
      const fandomId = Number(request.input('fandomId'))

      if (!wikiId || !mediaId || !fandomId) {
        return response.badRequest({ error: 'Missing wikiId, mediaId, or fandomId' })
      }

      const user = auth.user!
      const isMod = await this.modService.checkMod(user.userId, fandomId)

      if (isMod) {
        const result = await this.wikiService.removeMediaFromWiki(wikiId, mediaId)
        return response.ok({ status: 'removed', data: result })
      } else {
        const suggestion = await this.wikiService.editWikiPage(
          wikiId,
          JSON.stringify({
            action: 'REMOVE_MEDIA',
            mediaId: mediaId,
          }),
          user.userId
        )

        return response.created({
          status: 'pending',
          message: 'Your removal request has been submitted as an edit suggestion.',
          data: suggestion,
        })
      }
    } catch (error: any) {
      return response.internalServerError({ error: error.message })
    }
  }

  public async addHashtagToWiki({ params, request, auth, response }: HttpContext) {
    try {
      const wikiId = Number(params.wikiId)
      const hashtagId = Number(request.input('hashtagId'))
      const fandomId = Number(request.input('fandomId'))

      if (!wikiId || !hashtagId || !fandomId) {
        return response.badRequest({ error: 'Missing wikiId, hashtagId, or fandomId' })
      }

      const user = auth.user!
      const isMod = await this.modService.checkMod(user.userId, fandomId)

      if (isMod) {
        const wikipage = await this.wikiService.addHashtagsToWiki(wikiId, hashtagId)
        return response.ok({ status: 'approved', data: wikipage })
      } else {
        const suggestion = await this.wikiService.editWikiPage(
          wikiId,
          JSON.stringify({
            action: 'ADD_HASHTAG',
            hashtagId: hashtagId,
          }),
          user.userId
        )

        return response.created({
          status: 'pending',
          message: 'Your hashtag addition has been submitted as an edit suggestion.',
          data: suggestion,
        })
      }
    } catch (error: any) {
      return response.internalServerError({ error: error.message })
    }
  }

  public async removeHashtagFromWiki({ params, request, auth, response }: HttpContext) {
    try {
      const wikiId = Number(params.wikiId)
      const hashtagId = Number(params.hashtagId)
      const fandomId = Number(request.input('fandomId')) // Extracted from request query/body

      if (!wikiId || !hashtagId || !fandomId) {
        return response.badRequest({ error: 'Missing wikiId, hashtagId, or fandomId' })
      }

      const user = auth.user!

      const isMod = await this.modService.checkMod(user.userId, fandomId)

      if (isMod) {
        const wikipage = await this.wikiService.removeHashtagsFromWiki(wikiId, hashtagId)
        return response.ok({ status: 'removed', data: wikipage })
      } else {
        const suggestion = await this.wikiService.editWikiPage(
          wikiId,
          JSON.stringify({
            action: 'REMOVE_HASHTAG',
            hashtagId: hashtagId,
          }),
          user.userId
        )

        return response.created({
          status: 'pending',
          message: 'Your hashtag removal request has been submitted as an edit suggestion.',
          data: suggestion,
        })
      }
    } catch (error: any) {
      return response.internalServerError({ error: error.message })
    }
  }

  public async getByHashtag({ params, response }: HttpContext) {
    try {
      const hashtagId = Number(params.hashtagId)
      const wikipage = await this.wikiService.getWikisWithHashtag(hashtagId)
      return response.ok(wikipage)
    } catch (error: any) {
      return response.badRequest({ error: error.message })
    }
  }
}
