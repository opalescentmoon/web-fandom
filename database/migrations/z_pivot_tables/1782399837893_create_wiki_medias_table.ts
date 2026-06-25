import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wiki_medias'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('wiki_id').unsigned().references('id').inTable('wiki_pages').onDelete('CASCADE')
      table.integer('media_id').unsigned().references('id').inTable('media').onDelete('CASCADE')
      table.unique(['media_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
