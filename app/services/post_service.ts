import Post from '#models/DBModel/User/post'
import Media from '#models/DBModel/media'
import User from '#models/DBModel/User/user'

export class PostService {
  // main post service
  public async createPost(
    userId: number,
    fandomId: number,
    caption: string,
    parentId: number,
    postType: string,
    contentId: number
  ) {
    const user = await User.findOrFail(userId)

    const isMember = await user
      .related('fandoms')
      .query()
      .where('fandom_id', fandomId)
      .first()

    if (!isMember) {
      throw new Error('You must join this fandom to post')
    }

    return await Post.create({
      userId,
      fandomId,
      parentId,
      contentId,
      postType,
      caption,
    })
  }

  public async addHashtagToPost(postId: number, hashtagId: number) {
    const post = await Post.findOrFail(postId)
    await post.related('hashtags').attach([hashtagId])
    await post.load('hashtags')
    return post
  }

  public async removeHashtagToPost(postId: number, hashtagId: number) {
    const post = await Post.findOrFail(postId)
    await post.related('hashtags').detach([hashtagId])
    await post.load('hashtags')
    return post
  }

  public async editPost(postId: number, newContent: string) {
    const post = await Post.findOrFail(postId)
    post.caption = newContent
    await post.save()
    return post
  }

  public async deletePost(postId: number) {
    const post = await Post.findOrFail(postId)
    await post.delete()
    return post
  }

  // query posts
  public async getPost(postId: number) {
    const post = await Post.findOrFail(postId)
    return post
  }

  public async getPostsByUser(userId: number) {
    const posts = await Post.query().where('user_id', userId)
    return posts
  }

  public async getAllPosts() {
    const posts = await Post.all()
    return posts
  }

  public async getPostsByFandom(fandomId: number) {
    const posts = await Post.query().where('fandom_id', fandomId)
    return posts
  }

  public async getPostsByType(postType: string) {
    const posts = await Post.query().where('post_type', postType)
    return posts
  }

  public async getCommentsForPost(postId: number) {
    const comments = await Post.query().where('parent_id', postId)
    return comments
  }

  public async getPostsWithHashtag(hashtagId: number) {
    const posts = await Post.query().whereHas('hashtags', (query) => {
      query.where('hashtag_id', hashtagId)
    })
    return posts
  }

  // post & medias
  public async addMediaToPost(postId: number, mediaUrl: string, mediaType: string) {
    const media = await Media.create({ postId, fileUrl: mediaUrl, mediaType })
    return media
  }

  public async getMediaForPost(postId: number) {
    const mediaItems = await Media.query().where('post_id', postId)
    return mediaItems
  }

  public async removeMediaFromPost(postId: number, mediaId: number) {
    const post = await Post.findOrFail(postId)
    await post.load('media')

    const media = post.media.find((m) => m.id === mediaId)
    if (!media) {
      throw new Error('Media not found for this post.')
    }

    await media.delete()
  }

  // comments

  public async getCommentsByUser(userId: number) {
    const comments = await Post.query().where('user_id', userId).whereNotNull('parent_id')
    return comments
  }

  public async getAllComments() {
    const comments = await Post.query().whereNotNull('parent_id')
    return comments
  }
}
