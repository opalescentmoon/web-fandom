import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'post_medias'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('post_id').unsigned() // .references('post_id').inTable('posts').onDelete('CASCADE')
      table.integer('media_id').unsigned() // .references('id').inTable('media').onDelete('CASCADE')
      table.unique(['media_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
