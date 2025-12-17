import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Fandom from '#models/DBModel/fandom'
import Category from '#models/DBModel/category'
import Content from '#models/DBModel/content'
import User from '#models/DBModel/User/user'
import Media from '#models/DBModel/media'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    await Category.createMany([
      { category: 'Anime & Manga' },
      { category: 'Books & Literatures' },
      { category: 'Cartoons & Comics' },
      { category: 'Movies' },
      { category: 'Musics' },
      { category: 'TV Shows' },
      { category: 'Video Games' },
      { category: 'Other Media' },
    ])
    await Content.createMany([
      { contentName: 'Fanworks', contentBranch: 'Fanart' },
      { contentName: 'Fanworks', contentBranch: 'Fanfic' },
      { contentName: 'Fanworks', contentBranch: 'Fanmerch' },
      { contentName: 'Official', contentBranch: 'Announcement' },
      { contentName: 'Official', contentBranch: 'Lore' },
      { contentName: 'Official', contentBranch: 'Worldbuilding' },
      { contentName: 'Forum', contentBranch: 'Discussion' },
      { contentName: 'Forum', contentBranch: 'Polls' },
    ])
    await Media.createMany([
      { fileUrl: '#public/images/media_assets/Honkai-Star-Rail-thumbnail', mediaType: 'image' },
      { fileUrl: '#public/images/media_assets/reverse1999-thumbnail', mediaType: 'image' },
      { fileUrl: '#public/images/media_assets/wuthering-waves-thumbnail', mediaType: 'image' },
      { fileUrl: '#public/images/media_assets/Zenless-Zone-Zero-thumbnail', mediaType: 'image' },
    ])
    await Fandom.createMany([
      { fandomName: 'Honkai Star Rail', categoryId: 7, thumbnailMediaId: 1 },
      { fandomName: 'Reverse: 1999', categoryId: 7, thumbnailMediaId: 2 },
      { fandomName: 'Wuthering Waves', categoryId: 7, thumbnailMediaId: 3 },
      { fandomName: 'Zenless Zone Zero', categoryId: 7, thumbnailMediaId: 4 },
    ])
    await User.create({
      username: 'cyrup',
      displayName: 'cyrup',
      email: 'cyrene@cyrene.com',
      password: 'cyrene',
    })
    await db.table('user_fandom').insert([{ fandom_id: 1, user_id: 1 }])
  }
}
