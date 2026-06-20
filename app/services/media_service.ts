import fs from 'node:fs/promises'
import path from 'node:path'
import Media from '#models/DBModel/media'
import app from '@adonisjs/core/services/app'

export class MediaService {
  public static async delete(mediaId: number) {
    const media = await Media.find(mediaId)
    if (!media) return

    if (media.fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', media.fileUrl)
      await fs.unlink(filePath)
    }
    await media.delete()
  }

  public static async deleteThumbnail(mediaId: number) {
    const media = await Media.find(mediaId)
    if (!media) return

    if (media.fileUrl.startsWith('/images/media_assets/')) {
      const cleanRelativePath = media.fileUrl.startsWith('/')
        ? media.fileUrl.slice(1)
        : media.fileUrl
      const filePath = path.join(app.publicPath(), cleanRelativePath)
      try {
        await fs.unlink(filePath)
      } catch (fsError: any) {
        console.error(`[Disk Cleanup] File not found or could not be deleted:`, fsError.message)
      }
    }
    await Media.query().where('id', mediaId).delete()
  }
}
