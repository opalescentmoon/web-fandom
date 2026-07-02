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

    if (Number.isNaN(fandomId)) {
      return response.badRequest({ error: 'Invalid fandom ID provided' })
    }

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
  public async delete({ params, auth, response }: HttpContext) {
    try {
      const modId = Number(params.id)
      if (!modId) {
        return response.badRequest({ message: 'Invalid moderator ID.' })
      }
      const currentUser = auth.user!

      const targetMod = await this.modService.queryMods(modId)
      if (!targetMod) {
        return response.notFound({ message: 'Moderator not found.' })
      }

      const fandomId = targetMod.fandomId
      const targetUserId = targetMod.userId

      // 2. Count total mods in this fandom to prevent leaving a fandom abandoned
      const totalMods = await this.modService.countModsByFandom(fandomId)
      if (totalMods <= 1) {
        return response.badRequest({
          message:
            'Cannot remove moderator. There must be at least one moderator left in the fandom.',
        })
      }

      // 3. Security Check: Is the currentUser allowed to do this?
      const isSelf = currentUser.userId === targetUserId
      const currentUserIsMod = await this.modService.checkMod(currentUser.userId, fandomId)

      if (!currentUserIsMod && !isSelf) {
        return response.forbidden({
          message: 'You do not have permission to manage moderators for this fandom.',
        })
      }

      const deleted = await this.modService.deleteMod(modId)

      return response.ok({
        message: isSelf
          ? 'You have successfully stepped down as a moderator.'
          : 'Moderator removed.',
        data: deleted,
      })
    } catch (error: any) {
      return response.internalServerError({ error: error.message })
    }
  }
}
