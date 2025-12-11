import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('message_id')

      table.integer('chat_id').unsigned().references('id').inTable('posts').onDelete('CASCADE')

      table
        .integer('sender_id')
        .unsigned()
        .references('user_id')
        .inTable('users')
        .onDelete('CASCADE')

      table.text('message_text')

      table.integer('media_id').unsigned().references('id').inTable('media').onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('deleted_at')

      table.unique(['message_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
