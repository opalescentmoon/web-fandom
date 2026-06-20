import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'hashtag_posts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('hashtag_id').unsigned()
      // .references('id')
      // .inTable('hashtags')
      // .onDelete('CASCADE')

      table.integer('post_id').unsigned() // .references('post_id').inTable('posts').onDelete('CASCADE')

      table.unique(['post_id', 'hashtag_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
