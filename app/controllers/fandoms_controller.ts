import { HttpContext } from '@adonisjs/core/http'
import { FandomService } from '#services/fandom_service'
import { ModService } from '#services/mod_service'
import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'
import Fandom from '#models/DBModel/fandom'
import Media from '#models/DBModel/media'
import { MediaService } from '#services/media_service'
import fs from 'node:fs/promises'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class FandomsController {
  constructor(
    protected fandomService: FandomService,
    protected modService: ModService
  ) {}

  /**
   * Create a new fandom
   */
  public async create({ request, auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.unauthorized({ error: 'Not logged in' })

      const { fandomName, categoryId } = request.only(['fandomName', 'categoryId'])
      const fandom = await this.fandomService.createFandom(fandomName, categoryId)
      const newMod = await this.modService.addMod(user.userId, fandom.fandomId)
      await this.fandomService.joinFandom(user.userId, fandom.fandomId)

      return response.ok({ fandom, moderator: newMod })
    } catch (error: any) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Join a fandom
   */
  public async join({ request, auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.unauthorized({ error: 'Not logged in' })

      const { fandomId } = request.only(['fandomId'])
      const result = await this.fandomService.joinFandom(user.userId, fandomId)

      return response.ok(result)
    } catch (error: any) {
      return response.badRequest({ error: error.message })
    }
  }

  public async getAllMembers({ request, response }: HttpContext) {
    const fandomId = Number(request.input('fandomId'))
    const fandom = await Fandom.findOrFail(fandomId)

    const page = request.input('page', 1)
    const limit = 20

    const members = await fandom.related('users').query().paginate(page, limit)
    const raw = await db.from('user_fandom').where('fandom_id', fandomId)
    console.log('raw user_fandom:', raw)
    return response.ok(members)
  }

  /**
   * Get fandoms by category
   */
  public async getByCategory({ request, response }: HttpContext) {
    const categoryId = Number(request.input('categoryId'))
    if (!Number.isFinite(categoryId)) {
      return response.badRequest({ error: 'Invalid categoryId' })
    }

    const fandoms = await Fandom.query().where('category_id', categoryId).preload('thumbnailMedia')

    return response.ok(fandoms)
  }

  /**
   * Get fandoms by name
   */
  public async getByName({ request, response }: HttpContext) {
    const q = String(request.input('q') || '').trim()
    if (!q) return response.ok([])

    const fandoms = await Fandom.query()
      .whereILike('fandom_name', `%${q}%`)
      .preload('thumbnailMedia')

    return response.ok(fandoms)
  }

  /**
   * Edit fandom name
   */
  public async editName({ request, auth, response }: HttpContext) {
    try {
      const { fandomId, newName } = request.only(['fandomId', 'newName'])
      const userId = auth.user!.userId
      const isMod = await this.modService.checkMod(userId, fandomId)

      if (!isMod) {
        return response.forbidden({ message: 'You are not a moderator' })
      }

      const fandom = await this.fandomService.editFandomName(fandomId, newName)
      return response.ok(fandom)
    } catch (error: any) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Edit fandom category
   */
  public async editCategory({ request, auth, response }: HttpContext) {
    try {
      const { fandomId, categoryId } = request.only(['fandomId', 'categoryId'])

      const userId = auth.user!.userId
      const isMod = await this.modService.checkMod(userId, fandomId)

      if (!isMod) {
        return response.forbidden({ message: 'You are not a moderator' })
      }

      const fandom = await this.fandomService.editFandomCategory(fandomId, categoryId)
      return response.ok(fandom)
    } catch (error: any) {
      return response.badRequest({ error: error.message })
    }
  }

  public async addMedia({ request, response }: HttpContext) {
    try {
      const fandomId = Number(request.input('fandomId'))
      if (!fandomId) return response.badRequest({ error: 'Invalid fandomId' })

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

      await file.move(uploadDir, { name: fileName })

      if (!file.isValid) {
        return response.badRequest({ error: file.errors })
      }

      // Determine type
      const mediaType = file.type === 'video' ? 'video' : 'image'

      // Public URL path stored in DB
      const fileUrl = `/images/media_assets/${fileName}`

      // create media row w/o postId
      const media = await Media.create({ fileUrl, mediaType })

      return response.ok(media)
    } catch (error: any) {
      return response.internalServerError({ error: error.message })
    }
  }

  /**
   * Remove media
   */
  public async removeMedia({ request, response }: HttpContext) {
    try {
      const fandomId = Number(request.input('fandomId'))

      const removed = await this.fandomService.removeFandomImage(fandomId)
      return response.ok(removed)
    } catch (error: any) {
      return response.badRequest({ error: error.message })
    }
  }

  public async editFandomImage({ request, auth, response }: HttpContext) {
    try {
      const { fandomId } = request.only(['fandomId', 'thumbnailMediaId'])
      const { mediaId } = request.only(['mediaId'])

      const userId = auth.user!.userId
      const isMod = await this.modService.checkMod(userId, fandomId)

      if (!isMod) {
        return response.forbidden({ message: 'You are not a moderator' })
      }

      const fandom = await this.fandomService.editFandomImage(fandomId, mediaId)
      return response.ok(fandom)
    } catch (error: any) {
      return response.badRequest({ error: error.message })
    }
  }

  // for media cleanup if thumbnail is rejected
  public async cleanupUnusedMedia({ request, response }: HttpContext) {
    const { mediaId } = request.only(['mediaId'])

    if (mediaId) {
      try {
        await MediaService.deleteThumbnail(mediaId)
        return response.ok({ message: 'Unused media cleaned up successfully' })
      } catch (error) {
        return response.badRequest({ error: 'Failed to purge media asset' })
      }
    }

    return response.badRequest({ error: 'No mediaId provided' })
  }

  public async leaveFandom({ request, auth, response }: HttpContext) {
    try {
      const { fandomId } = request.only(['fandomId'])
      const userId = auth.user!.userId

      await this.fandomService.removeUserFromFandom(userId, fandomId)
      return response.ok({ message: 'Successfully left fandom' })
    } catch (err: any) {
      return response.badRequest({ error: err.message })
    }
  }

  public async kickFromFandom({ request, auth, response }: HttpContext) {
    try {
      const { fandomId } = request.only(['fandomId'])
      const modId = auth.user!.userId
      const isMod = await this.modService.checkMod(modId, fandomId)

      if (!isMod) {
        return response.forbidden({ message: 'You are not a moderator' })
      }

      const { userId } = request.only(['userId'])
      await this.modService.kickFandomMember(userId, fandomId)
      return response.ok({ message: 'Successfully kicked user' })
    } catch (err: any) {
      return response.badRequest({ message: err.message })
    }
  }

  /**
   * Delete a fandom
   */
  public async delete({ request, auth, response }: HttpContext) {
    try {
      const { fandomId } = request.only(['fandomId'])

      const userId = auth.user!.userId
      const isMod = await this.modService.checkMod(userId, fandomId)

      if (!isMod) {
        return response.forbidden({ message: 'You are not a moderator' })
      }

      const fandom = await this.fandomService.deleteFandom(fandomId)
      return response.ok(fandom)
    } catch (error: any) {
      return response.badRequest({ error: error.message })
    }
  }
}
