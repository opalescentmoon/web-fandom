import Hashtag from '#models/DBModel/hashtag'

export class HashtagService {
  // Your code here
  public async findOrCreateHashtag(tag: string) {
    let hashtag = await Hashtag.query().where('hashtagName', tag).first()
    if (!hashtag) {
      hashtag = await Hashtag.create({ hashtagName: tag })
    }
    return hashtag
  }

  public async getHashtagByName(tag: string) {
    const hashtag = await Hashtag.query().where('hashtagName', tag).first()
    return hashtag
  }

  public async getAllHashtags() {
    const hashtags = await Hashtag.query()
    return hashtags
  }
}
