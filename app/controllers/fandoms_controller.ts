import { HttpContext } from '@adonisjs/core/http'
import { FandomService } from '#services/fandom_service'
import { ModService } from '#services/mod_service'

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
    try {
      const { categoryId } = request.only(['categoryId'])
      const fandoms = await this.fandomService.getFandomByCategory(categoryId)
      return response.ok(fandoms)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Get fandoms by name
   */
  public async getByName({ request, response }: HttpContext) {
    try {
      const { fandomName } = request.only(['fandomName'])
      const fandoms = await this.fandomService.getFandomByName(fandomName)
      return response.ok(fandoms)
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
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
