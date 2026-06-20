import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'chat_members'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('chat_id').unsigned().references('chat_id').inTable('chats').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('user_id').inTable('users').onDelete('CASCADE')

      table.unique(['chat_id', 'user_id'])

      table.timestamp('joined_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
