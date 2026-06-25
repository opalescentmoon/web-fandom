// app/Controllers/Http/ModController.ts
import { HttpContext } from '@adonisjs/core/http'
import { ModService } from '#services/mod_service'
import { inject } from '@adonisjs/core'

@inject()
export default class ModController {
  constructor(protected modService: ModService) {}

  /**
   * Add a moderator
   */
  public async add({ request, auth, response }: HttpContext) {
    try {
      const targetUserId = Number(request.input('user_id'))
      const fandomId = Number(request.input('fandom_id'))

      if (!targetUserId || !fandomId) {
        return response.badRequest({ message: 'user_id and fandom_id are required' })
      }

      const currentUser = auth.user!

      const currentUserIsMod = await this.modService.checkMod(currentUser.userId, fandomId)
      if (!currentUserIsMod) {
        return response.forbidden({
          message: 'You do not have permission to add moderators to this fandom.',
        })
      }

      const isTargetMod = await this.modService.checkMod(targetUserId, fandomId)
      if (isTargetMod) {
        return response.conflict({ message: 'User is already a moderator for this fandom' })
      }

      const mod = await this.modService.addMod(targetUserId, fandomId)
      return response.created({ message: 'Moderator added successfully', data: mod })
    } catch (error: any) {
      return response.internalServerError({ error: error.message })
    }
  }

  /**
   * Check if user is a moderator
   */
  public async check({ params, response }: HttpContext) {
    const userId = Number(params.userId)
    const fandomId = Number(params.fandomId)
    const isMod = await this.modService.checkMod(userId, fandomId)

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
