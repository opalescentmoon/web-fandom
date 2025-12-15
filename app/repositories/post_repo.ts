// app/Repositories/PostRepository.ts

import Post from '#models/DBModel/User/post'
import Media from '#models/DBModel/media'

export default class PostRepository {
  async getById(id: number) {
    return await Post.find(id)
  }

  async create(data: {
    userId: number
    fandomId: number
    contentId: number
    parentId: number
    postType: string
    title: string
    caption: string
  }) {
    return await Post.create(data)
  }

  async delete(id: number) {
    const post = await Post.findOrFail(id)
    await post.delete()
  }

  async update(id: number, data: Partial<Post>) {
    const post = await Post.findOrFail(id)

    if (!('parentId' in data)) {
      const { parentId, ...safeData } = data

      post.merge(safeData)
      await post.save()
      return post
    }

    throw new Error('Updating parentId is not allowed')
  }

  async addMedia(postId: number, mediaData: { fileUrl: string; mediaType: string }) {
    const post = await Post.findOrFail(postId)

    const media = await Media.create({
      ...mediaData,
      postId: post.postId, // connect media to post
    })

    return media
  }

  async getMediaByPostId(postId: number) {
    const post = await Post.findOrFail(postId)
    return await post.related('media').query()
  }

  async removeMedia(mediaId: number) {
    const media = await Media.findOrFail(mediaId)
    await media.delete()
  }

  async getPostsByFandom(fandomId: number) {
    return await Post.query().where('fandomId', fandomId)
  }

  async getPostsByUser(userId: number) {
    return await Post.query().where('userId', userId)
  }
}
