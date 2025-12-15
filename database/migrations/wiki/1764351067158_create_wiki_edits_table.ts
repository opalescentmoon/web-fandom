import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wiki_edits'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('page_id').unsigned() // .references('id').inTable('wiki_pages').onDelete('CASCADE')

      table
        .integer('editor_id')
        .unsigned()
        // .references('user_id')
        // .inTable('users')
        // .onDelete('CASCADE')

      table.text('content')

      table.enum('status', ['Pending', 'Approved', 'Rejected'])

      table
        .integer('reviewed_by')
        .unsigned()
        // .references('user_id')
        // .inTable('users')
        // .onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('reviewed_at')
      // table.unique(['fandom_id', 'content_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
