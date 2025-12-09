import Like from '#models/DBModel/like'

export class LikeService {
  /**
   * Add a like if it doesn't already exist.
   * Returns the existing or newly created Like model.
   */
  public async addLike(userId: number, postId: number) {
    const existing = await Like.query().where('userId', userId).andWhere('postId', postId).first()
    if (existing) return existing

    const like = await Like.create({ userId, postId })
    return like
  }

  /** Remove a like by user and post. Returns true if removed, false if not found. */
  public async removeLike(userId: number, postId: number) {
    const like = await Like.query().where('userId', userId).andWhere('postId', postId).first()
    if (!like) return false

    await like.delete()
    return true
  }

  /** Toggle like: add if missing, remove if exists. Returns { action: 'added' | 'removed', like?: Like } */
  public async toggleLike(userId: number, postId: number) {
    const like = await Like.query().where('userId', userId).andWhere('postId', postId).first()
    if (like) {
      await like.delete()
      return { action: 'removed' as const }
    }

    const newLike = await Like.create({ userId, postId })
    return { action: 'added' as const, like: newLike }
  }

  /** Return number of likes for a post. */
  public async countLikes(postId: number) {
    const rows = await Like.query().where('postId', postId).count('* as total')
    // Lucid returns an array with an object containing total as string or number
    const total = rows && rows[0] ? (rows[0] as any).total : 0
    return Number(total)
  }
}
