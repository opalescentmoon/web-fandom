import Like from '#models/DBModel/like'

export class LikeService {
  /**
   * Add a like if it doesn't already exist.
   * Returns the existing or newly created Like model.
   */
  public async addLike(userId: number, postId: number) {
    const existing = await Like.query().where('user_id', userId).andWhere('post_id', postId).first()
    if (existing) return existing

    const like = await Like.create({ userId, postId })
    return like
  }

  /** Remove a like by user and post. Returns true if removed, false if not found. */
  public async removeLike(userId: number, postId: number) {
    const like = await Like.query().where('user_id', userId).andWhere('post_id', postId).first()
    if (!like) return false

    await like.delete()
    return true
  }

  /** Toggle like: add if missing, remove if exists. Returns { action: 'added' | 'removed', like?: Like } */
  public async toggleLike(userId: number, postId: number) {
    const existing = await Like.query()
      .where('user_id', userId)
      .andWhere('post_id', postId)
      .first()

    let liked: boolean

    if (existing) {
      await existing.delete()
      liked = false
    } else {
      await Like.create({ userId, postId })
      liked = true
    }

    // count likes for the post
    const countRow = await Like.query()
      .where('post_id', postId)
      .count('* as total')
      .first()

    const likeCount = Number(countRow?.$extras?.total ?? 0)

    return {
      action: liked ? ('added' as const) : ('removed' as const),
      liked,
      likeCount,
    }
  }

  /** Return number of likes for a post. */
  public async countLikes(postId: number) {
    const rows = await Like.query().where('post_id', postId).count('* as total')
    // Lucid returns an array with an object containing total as string or number
    const total = rows && rows[0] ? (rows[0] as any).total : 0
    return Number(total)
  }
}
