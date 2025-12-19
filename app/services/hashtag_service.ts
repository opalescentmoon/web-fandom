import Hashtag from '#models/DBModel/hashtag'
import db from '@adonisjs/lucid/services/db'

export class HashtagService {
  // Your code here
  public async findOrCreateHashtag(tag: string) {
    const name = String(tag || '').replace(/^#/, '').trim()
    if (!name) throw new Error('Tag is required')
    let hashtag = await Hashtag.query().where('hashtag_name', name).first()
    if (!hashtag) {
      hashtag = await Hashtag.create({ hashtagName: name })
    }
    return hashtag.serialize()
  }

  public async getHashtagByName(tag: string) {
    const hashtag = await Hashtag.query().where('hashtagName', tag).first()
    return hashtag
  }

  public async getAllHashtags() {
    const hashtags = await Hashtag.query()
    return hashtags
  }

  public async getTrendingByFandom(fandomId: number, limit = 5) {
    const rows = await db
      .from('hashtag_posts')
      .join('hashtags', 'hashtags.id', 'hashtag_posts.hashtag_id')
      .join('posts', 'posts.post_id', 'hashtag_posts.post_id')
      .where('posts.fandom_id', fandomId)
      .groupBy('hashtags.id', 'hashtags.hashtag_name')
      .select('hashtags.id', 'hashtags.hashtag_name')
      .count('* as uses')
      .orderBy('uses', 'desc')
      .limit(limit)

    // normalize output to something your JS can consume easily
    return rows.map((r) => ({
      id: r.id,
      name: r.hashtag_name,
      uses: Number(r.uses),
    }))
  }

  public async usedInBranch(params: { fandomId: number; branch: string }) {
    const { fandomId, branch } = params

    const rows = await Hashtag.query()
      .select('hashtags.id as hashtagId', 'hashtags.hashtag_name as hashtagName')
      .join('hashtag_posts', 'hashtags.id', 'hashtag_posts.hashtag_id')
      .join('posts', 'posts.post_id', 'hashtag_posts.post_id')
      .join('contents', 'contents.content_id', 'posts.content_id')
      .where('posts.fandom_id', fandomId)
      .where('contents.content_branch', branch)
      .groupBy('hashtags.id', 'hashtags.hashtag_name')
      .orderBy('hashtags.hashtag_name', 'asc')
      .pojo() 

    return rows
  }

}
