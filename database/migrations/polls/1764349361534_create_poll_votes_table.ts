import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'poll_votes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('poll_option_id')
        .unsigned()
        // .references('id')
        // .inTable('poll_options')
        // .onDelete('CASCADE')

      table.integer('user_id').unsigned() // .references('user_id').inTable('users').onDelete('CASCADE')

      table.unique(['poll_option_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
