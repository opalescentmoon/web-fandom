import Moderator from '#models/DBModel/User/moderator'

export class ModService {
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
    return await Moderator.query().where('user_id', userId).preload('user')
  }

  public async getModsByFandom(fandomId: number) {
    const mod = await Moderator.query().where('fandom_id', fandomId).preload('user')
    return mod
  }

  public async deleteMod(id: number) {
    const mod = await Moderator.findOrFail(id)
    await mod.delete()
    return mod
  }
}
