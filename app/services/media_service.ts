import fs from 'node:fs/promises'
import path from 'node:path'
import Media from '#models/DBModel/media'

export class MediaService {
  public static async delete(mediaId: number) {
    const media = await Media.find(mediaId)
    if (!media) return

    if (media.fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', media.fileUrl)
      await fs.unlink(filePath)

      await media.delete()
    }
  }

  public static async deleteThumbnail(mediaId: number) {
    const media = await Media.find(mediaId)
    if (!media) return

    if (media.fileUrl.startsWith('/images/media_assets/')) {
      const filePath = path.join(process.cwd(), 'public', media.fileUrl)
      await fs.unlink(filePath)

      await media.delete()
    }
  }
}
