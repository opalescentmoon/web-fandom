// app/Controllers/Http/ModController.ts
import { HttpContext } from '@adonisjs/core/http'
import { ModService } from '#services/mod_service'

export default class ModController {
  private modService: ModService

  constructor() {
    this.modService = new ModService()
  }

  /**
   * Add a moderator
   */
  public async add({ request, response }: HttpContext) {
    const userId = request.input('user_id')

    if (!userId) {
      return response.badRequest({ message: 'user_id is required' })
    }

    const mod = await this.modService.addMod(userId)
    return response.created({ message: 'Moderator added', data: mod })
  }

  /**
   * Check if user is a moderator
   */
  public async check({ params, response }: HttpContext) {
    const userId = Number(params.userId)
    const isMod = await this.modService.checkMod(userId)

    return response.ok({ userId, isMod })
  }

  /**
   * Get moderators for a specific user
   */
  public async query({ params, response }: HttpContext) {
    const userId = Number(params.userId)
    const mods = await this.modService.queryMods(userId)

    return response.ok({ data: mods })
  }

  /**
   * Get moderators by fandom
   */
  public async byFandom({ params, response }: HttpContext) {
    const fandomId = Number(params.fandomId)
    const mods = await this.modService.getModsByFandom(fandomId)

    return response.ok({ data: mods })
  }

  /**
   * Delete a moderator
   */
  public async delete({ params, response }: HttpContext) {
    const id = Number(params.id)
    const deleted = await this.modService.deleteMod(id)

    return response.ok({ message: 'Moderator removed', data: deleted })
  }
}
