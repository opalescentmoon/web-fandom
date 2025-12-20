import { HttpContext } from '@adonisjs/core/http'
import { FandomService } from '#services/fandom_service'
import { ModService } from '#services/mod_service'
import Fandom from '#models/DBModel/fandom'

export default class FandomsController {
  private fandomService = new FandomService()
  private modService = new ModService()

  /**
   * Create a new fandom
   */
  public async create({ request, auth, response }: HttpContext) {
    try {
      const { fandomName, categoryId } = request.only(['fandomName', 'categoryId'])
      const userId = auth.user!.userId
      const isMod = await this.modService.checkMod(userId)

      if (!isMod) {
        return response.forbidden({ message: 'You are not a moderator' })
      }

      const fandom = await this.fandomService.createFandom(fandomName, categoryId)

      return response.ok(fandom)
    } catch (error) {
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
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Get fandoms by category
   */
  public async getByCategory({ request, response }: HttpContext) {
    const categoryId = Number(request.input('categoryId'))
    if (!Number.isFinite(categoryId)) {
      return response.badRequest({ error: 'Invalid categoryId' })
    }

    const fandoms = await Fandom.query()
      .where('category_id', categoryId)
      .preload('thumbnailMedia')

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
      const isMod = await this.modService.checkMod(userId)

      if (!isMod) {
        return response.forbidden({ message: 'You are not a moderator' })
      }

      const fandom = await this.fandomService.editFandomName(fandomId, newName)
      return response.ok(fandom)
    } catch (error) {
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
      const isMod = await this.modService.checkMod(userId)

      if (!isMod) {
        return response.forbidden({ message: 'You are not a moderator' })
      }

      const fandom = await this.fandomService.editFandomCategory(fandomId, categoryId)
      return response.ok(fandom)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Delete a fandom
   */
  public async delete({ request, auth, response }: HttpContext) {
    try {
      const { fandomId } = request.only(['fandomId'])

      const userId = auth.user!.userId
      const isMod = await this.modService.checkMod(userId)

      if (!isMod) {
        return response.forbidden({ message: 'You are not a moderator' })
      }

      const fandom = await this.fandomService.deleteFandom(fandomId)
      return response.ok(fandom)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }
}
