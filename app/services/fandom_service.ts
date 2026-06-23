import Fandom from '#models/DBModel/fandom'
import User from '#models/DBModel/User/user'
import { MediaService } from './media_service.js'

export class FandomService {
  public async createFandom(fandomName: string, categoryId: number) {
    const fandom = await Fandom.create({ fandomName, categoryId })
    return fandom
  }

  public async joinFandom(userId: number, fandomId: number) {
    const user = await User.findOrFail(userId)

    await user.related('fandoms').attach([fandomId])
    return { success: true }
  }

  public async getFandomMembers(fandomId: number) {
    const fandom = await Fandom.query()
      .where('fandom_id', fandomId)
      .withCount('users')
      .firstOrFail()

    const memberCount = fandom.$extras.users_count
    return memberCount
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

    const oldThumbnail = fandom.thumbnailMediaId

    if (oldThumbnail === thumbnailMediaId) {
      return fandom
    }

    fandom.thumbnailMediaId = thumbnailMediaId
    await fandom.save()

    if (oldThumbnail) {
      await MediaService.deleteThumbnail(oldThumbnail)
    }

    return fandom
  }

  public async removeFandomImage(fandomId: number) {
    const fandom = await Fandom.findOrFail(fandomId)
    const oldThumbnail = fandom.thumbnailMediaId

    if (!oldThumbnail) return fandom

    fandom.thumbnailMediaId = null
    await fandom.save()

    await MediaService.deleteThumbnail(oldThumbnail)

    return fandom
  }

  public async removeUserFromFandom(userId: number, fandomId: number) {
    const user = await User.findOrFail(userId)

    await user.related('fandoms').detach([fandomId])
    return { success: true }
  }

  public async deleteFandom(fandomId: number) {
    const fandom = await Fandom.findOrFail(fandomId)
    const oldThumbnail = fandom.thumbnailMediaId

    await fandom.delete()

    if (oldThumbnail) {
      await MediaService.deleteThumbnail(oldThumbnail)
    }
    return fandom
  }
}
