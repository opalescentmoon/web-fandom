import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'hashtag_wikis'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('hashtag_id')
        .unsigned()
        .references('id')
        .inTable('hashtags')
        .onDelete('CASCADE')

      table.integer('wiki_id').unsigned().references('id').inTable('wiki_pages').onDelete('CASCADE')

      table.unique(['wiki_id', 'hashtag_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
