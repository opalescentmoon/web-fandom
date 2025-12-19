import Post from '#models/DBModel/User/post'
import Media from '#models/DBModel/media'
import User from '#models/DBModel/User/user'
import Like from '#models/DBModel/like'

export class PostService {
  // main post service
  public async createPost(
    userId: number,
    fandomId: number,
    caption: string,
    parentId: number | null,
    postType: string,
    contentId: number
  ) {
    const user = await User.findOrFail(userId)

    const isMember = await user
      .related('fandoms')
      .query()
      .where('user_fandom.fandom_id', fandomId)
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

  public async getPostsByUser(userId: number, fandomId?: number, branch?: string) {
    const query = Post.query()
      .where('posts.user_id', userId)
      .join('contents', 'contents.content_id', 'posts.content_id')
      .select(
        'posts.*',
        'contents.content_name as "contentName"',
        'contents.content_branch as "contentBranch"'
      )
      .preload('user')
      .preload('hashtags')
      .orderBy('posts.created_at', 'desc')

    if (fandomId) query.where('posts.fandom_id', fandomId)
    if (branch) query.where('contents.content_branch', branch)

    return query
  }

  public async getAllPosts() {
    const posts = await Post.all()
    return posts
  }

  public async getPostsByFandom(
    fandomId: number,
    tab?: string,
    branch?: string,
    userId?: number | null
  ) {
    const TAB_TO_CONTENT_NAME: Record<string, string> = {
      fanworks: 'Fanwork',
      wiki: 'Official',
      forum: 'Forum',
    }

    const query = Post.query()
      .where('posts.fandom_id', fandomId)
      .join('contents', 'contents.content_id', 'posts.content_id')
      .select(
        'posts.*',
        'contents.content_name as contentName',
        'contents.content_branch as contentBranch'
      )
      .preload('hashtags')
      .preload('media')
      .preload('user', (u) => {
        u.select(['user_id', 'user_name', 'display_name', 'profile_picture'])
      })
      .orderBy('posts.created_at', 'desc')

    if (tab && TAB_TO_CONTENT_NAME[tab]) {
      query.where('contents.content_name', TAB_TO_CONTENT_NAME[tab])
    }

    if (branch) {
      query.where('contents.content_branch', branch)
    }

    const posts = await query

    // base rows (what you already return)
    const rows = posts.map((p) => ({
      ...p.serialize(),
      ...p.$extras,
    }))

    // collect post ids safely (supports postId/post_id/id)
    const postIds = rows
      .map((p: any) => Number(p.postId ?? p.post_id ?? p.id))
      .filter((n: number) => Number.isFinite(n))

    if (!postIds.length) return rows

    // like_count per post
    const countRows = await Like.query()
      .whereIn('post_id', postIds)
      .select('post_id')
      .count('* as total')
      .groupBy('post_id')

    const likeCountMap = new Map<number, number>()
    for (const r of countRows as any[]) {
      const pid = Number(r.postId ?? r.post_id ?? r.$extras?.post_id)
      const total = Number(r.$extras?.total ?? 0)
      likeCountMap.set(pid, total)
    }

    // liked_by_me set (only if logged in)
    let likedSet = new Set<number>()
    if (userId) {
      const likedRows = await Like.query()
        .where('user_id', userId)
        .whereIn('post_id', postIds)
        .select('post_id')

      likedSet = new Set(
        likedRows.map((r: any) => Number(r.postId ?? r.post_id))
      )
    }

    // attach fields
    return rows.map((p: any) => {
      const pid = Number(p.postId ?? p.post_id ?? p.id)
      return {
        ...p,
        like_count: likeCountMap.get(pid) ?? 0,
        liked_by_me: userId ? likedSet.has(pid) : false,
      }
    })
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

  public async getPostWithContent(postId: number) {
    const row = await Post.query()
      .where('posts.post_id', postId)
      .join('contents', 'contents.content_id', 'posts.content_id')
      .select(
        'posts.*',
        'contents.content_name as contentName',
        'contents.content_branch as contentBranch'
      )
      .first()

    if (!row) return null

    return {
      ...row.serialize(),
      ...row.$extras,
    }
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

  public async searchByHashtag({
    fandomId,
    q,
    tab,
    branch,
  }: {
    fandomId: number
    q: string
    tab?: string
    branch?: string
  }) {
    const TAB_TO_CONTENT_NAME: Record<string, string> = {
      fanworks: 'Fanwork',
      wiki: 'Official',
      forum: 'Forum',
    }

    const key = String(q || '').replace(/^#/, '').trim().toLowerCase()
    if (!key) return []

    const query = Post.query()
      .where('posts.fandom_id', fandomId)
      .join('hashtag_posts', 'hashtag_posts.post_id', 'posts.post_id')
      .join('hashtags', 'hashtags.id', 'hashtag_posts.hashtag_id')
      .join('contents', 'contents.content_id', 'posts.content_id')
      .whereRaw('LOWER(hashtags.hashtag_name) = ?', [key])
      .distinct('posts.post_id')
      .select(
        'posts.*',
        'contents.content_name as contentName',
        'contents.content_branch as contentBranch'
      )
      .preload('hashtags')
      .preload('user', (u) => {
        u.select(['user_id', 'user_name', 'display_name', 'profile_picture'])
      })
      .orderBy('posts.created_at', 'desc')

    // TAB filter
    if (tab && TAB_TO_CONTENT_NAME[tab]) {
      query.where('contents.content_name', TAB_TO_CONTENT_NAME[tab])
    }

    // BRANCH filter (single-select)
    if (branch) {
      query.where('contents.content_branch', branch)
    }

    const posts = await query

    return posts.map((p) => ({
      ...p.serialize(),
      ...p.$extras,
    }))
  }

}
