import Fandom from '#models/DBModel/fandom'
import User from '#models/DBModel/User/user'
import { ModService } from './mod_service.js'

export class FandomService {
  public async createFandom(fandomName: string, categoryId: number, userId: number) {
    const fandom = await Fandom.create({ fandomName, categoryId })
    const modService = new ModService()
    await modService.addMod(userId, fandom.fandomId)
    return fandom
  }

  public async joinFandom(userId: number, fandomId: number) {
    const user = await User.findOrFail(userId)
    const fandom = await Fandom.findOrFail(fandomId)

    await user.related('fandoms').attach([fandom.fandomId])
    return { success: true }
  }

  public async getFandomByCategory(categoryId: number) {
    const fandom = await Fandom.query().where('category_id', categoryId)
    return fandom
  }

  public async getFandomByName(fandomName: string) {
    const fandom = await Fandom.query().where('fandom_name', fandomName)
    return fandom
  }

  public async editFandomName(fandomId: number, newName: string) {
    const fandom = await Fandom.findOrFail(fandomId)
    fandom.fandomName = newName
    await fandom.save()
    return fandom
  }

  public async editFandomCategory(fandomId: number, categoryId: number) {
    const fandom = await Fandom.findOrFail(fandomId)
    fandom.categoryId = categoryId
    await fandom.save()
    return fandom
  }

  public async editFandomImage(fandomId: number, thumbnailMediaId: number) {
    const fandom = await Fandom.findOrFail(fandomId)
    fandom.thumbnailMediaId = thumbnailMediaId
    await fandom.save()
    return fandom
  }

  public async deleteFandom(fandomId: number) {
    const fandom = await Fandom.findOrFail(fandomId)
    await fandom.delete()
    return fandom
  }
}
