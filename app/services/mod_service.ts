import Moderator from '#models/DBModel/User/moderator'
import { FandomService } from './fandom_service.js'
import { inject } from '@adonisjs/core'

@inject()
export class ModService {
  constructor(protected fandomService: FandomService) {}

  // Add a new moderator
  public async addMod(userId: number, fandomId: number) {
    const mod = await Moderator.create({ userId, fandomId })
    return mod
  }

  public async checkMod(userId: number, fandomId: number): Promise<boolean> {
    const mod = await Moderator.query()
      .where('user_id', userId)
      .where('fandom_id', fandomId)
      .first()
    return !!mod
  }

  public async queryMods(userId: number) {
    return await Moderator.query().where('user_id', userId).preload('user').first()
  }

  public async queryModsbyFandom(userId: number, fandomId: number) {
    return await Moderator.query()
      .where('user_id', userId)
      .where('fandom_id', fandomId)
      .preload('user')
      .first()
  }

  public async countModsByFandom(fandomId: number): Promise<number> {
    const result = await Moderator.query().where('fandom_id', fandomId).count('* as total').first()

    // Lucid returns the aggregate result inside an object, or null if nothing matched
    return result ? Number(result.$extras.total) : 0
  }

  public async getModsByFandom(fandomId: number) {
    const mod = await Moderator.query().where('fandom_id', fandomId).preload('user')
    return mod
  }

  public async kickFandomMember(userId: number, fandomId: number) {
    await this.fandomService.removeUserFromFandom(userId, fandomId)
  }

  public async deleteMod(id: number) {
    const mod = await Moderator.findOrFail(id)
    await mod.delete()
    return mod
  }
}
