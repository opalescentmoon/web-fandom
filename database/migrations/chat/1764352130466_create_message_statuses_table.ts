import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'message_statuses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('message_id')
        .unsigned()
        // .references('message_id')
        // .inTable('message')
        // .onDelete('CASCADE')

      table.integer('user_id').unsigned() // .references('user_id').inTable('users').onDelete('CASCADE')

      table.string('status').notNullable()
      table.check(`status IN ('sent', 'delivered', 'read', 'failed')`)

      table.timestamp('sent_at')
      table.timestamp('delivered_at')
      table.timestamp('read_at')
      table.timestamp('failed_at')
      table.integer('retry_count')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
