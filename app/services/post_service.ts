import Post from '#models/DBModel/User/post'
import Media from '#models/DBModel/media'
import User from '#models/DBModel/User/user'
import Like from '#models/DBModel/like'
import Poll from '#models/DBModel/Polls/poll'
import PollVote from '#models/DBModel/Polls/poll_vote'

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

    // base rows
    const rows = posts.map((p) => ({
      ...p.serialize(),
      ...p.$extras, // contentName/contentBranch
    }))

    const postIds = rows
      .map((p: any) => Number(p.postId ?? p.post_id ?? p.id))
      .filter((n: number) => Number.isFinite(n))

    if (!postIds.length) return rows

    /**
     * =========================
     * LIKE INFO
     * =========================
     */
    const likeCountRows = await Like.query()
      .whereIn('post_id', postIds)
      .select('post_id')
      .count('* as total')
      .groupBy('post_id')

    const likeCountMap = new Map<number, number>()
    for (const r of likeCountRows as any[]) {
      const pid = Number(r.$extras?.post_id ?? r.post_id ?? r.postId)
      const total = Number(r.$extras?.total ?? r.total ?? 0)
      likeCountMap.set(pid, total)
    }

    let likedSet = new Set<number>()
    if (typeof userId === 'number') {
      const likedRows = await Like.query()
        .where('user_id', userId)
        .whereIn('post_id', postIds)
        .select('post_id')

      likedSet = new Set(likedRows.map((r: any) => Number(r.$extras?.post_id ?? r.post_id ?? r.postId)))
    }

    /**
     * =========================
     * POLL INFO
     * =========================
     */
    const pollPostIds = rows
      .filter((p: any) => String(p.contentBranch || '').toLowerCase() === 'polls')
      .map((p: any) => Number(p.postId ?? p.post_id ?? p.id))
      .filter((n: number) => Number.isFinite(n))

    const pollByPostId = new Map<number, any>()
    const countsByPost = new Map<number, Map<number, number>>() // postId -> (optionId -> total)

    if (pollPostIds.length) {
      const polls = await Poll.query()
        .whereIn('post_id', pollPostIds)
        .preload('options') // Poll must have hasMany options

      polls.forEach((poll) => pollByPostId.set(poll.postId, poll))

      // IMPORTANT: groupBy real columns (not alias), but select alias for reading
      const voteCountRows = await PollVote.query()
        .join('poll_options', 'poll_options.id', 'poll_votes.poll_option_id')
        .join('polls', 'polls.id', 'poll_options.poll_id')
        .whereIn('polls.post_id', pollPostIds)
        .select(
          'polls.post_id as post_id',
          'poll_votes.poll_option_id as poll_option_id'
        )
        .count('* as total')
        .groupBy('polls.post_id', 'poll_votes.poll_option_id')

      for (const r of voteCountRows as any[]) {
        const postId = Number(r.$extras?.post_id ?? r.post_id ?? r.postId)
        const optionId = Number(
          r.$extras?.poll_option_id ??
          r.poll_option_id ??
          r.pollOptionId
        )
        const total = Number(r.$extras?.total ?? r.total ?? 0)

        if (!countsByPost.has(postId)) countsByPost.set(postId, new Map())
        countsByPost.get(postId)!.set(optionId, total)
      }
    }

    let myVoteByPostId = new Map<number, number>() // postId -> pollOptionId

    if (typeof userId === 'number' && pollPostIds.length) {
      const myVoteRows = await PollVote.query()
        .join('poll_options', 'poll_options.id', 'poll_votes.poll_option_id')
        .join('polls', 'polls.id', 'poll_options.poll_id')
        .where('poll_votes.user_id', userId)
        .whereIn('polls.post_id', pollPostIds)
        .select(
          'polls.post_id as post_id',
          'poll_votes.poll_option_id as poll_option_id'
        )

      for (const r of myVoteRows as any[]) {
        const postId = Number(r.$extras?.post_id)

        const optId = Number(
          r.pollOptionId ??               // main
          r.$extras?.poll_option_id ??    // <-- fallback 
          r.$extras?.pollOptionId         // <-- fallback
        )

        if (Number.isFinite(postId) && Number.isFinite(optId)) {
          myVoteByPostId.set(postId, optId)
        }
      }
    }


    /**
     * =========================
     * FINAL ATTACH
     * =========================
     */
    return rows.map((p: any) => {
      const pid = Number(p.postId ?? p.post_id ?? p.id)

      const out: any = {
        ...p,
        like_count: likeCountMap.get(pid) ?? 0,
        liked_by_me: typeof userId === 'number' ? likedSet.has(pid) : false,
      }

      const poll = pollByPostId.get(pid)
      if (poll) {
        const pollJson = poll.serialize()
        const optionCounts = countsByPost.get(pid) || new Map<number, number>()

        out.poll = {
          id: pollJson.id,
          question: pollJson.question,
          myVotedOptionId: myVoteByPostId.get(pid) ?? null,
          options: (pollJson.options || []).map((o: any) => ({
            id: o.id,
            optionText: o.optionText ?? o.option_text,
            votes: optionCounts.get(o.id) ?? 0,
          })),
        }
      }

      return out
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
