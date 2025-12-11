import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'relationships'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('follow_id')
        .unsigned()
        .references('user_id')
        .inTable('users')
        .onDelete('CASCADE')

      table
        .integer('followed_id')
        .unsigned()
        .references('user_id')
        .inTable('users')
        .onDelete('CASCADE')

      table.unique(['follow_id', 'followed_id'])

      table.timestamp('timestamp')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
