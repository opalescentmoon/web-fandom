import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wiki_pages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('fandom_id')
        .unsigned()
        .references('fandom_id')
        .inTable('fandoms')
        .onDelete('CASCADE')

      table
        .integer('content_id')
        .unsigned()
        .references('content_id')
        .inTable('contents')
        .onDelete('CASCADE')

      table.string('title')

      table.text('content')

      table
        .integer('created_by')
        .unsigned()
        .references('user_id')
        .inTable('users')
        .onDelete('CASCADE')

      table
        .integer('approved_by')
        .unsigned()
        .references('user_id')
        .inTable('users')
        .onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.unique(['fandom_id', 'content_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
