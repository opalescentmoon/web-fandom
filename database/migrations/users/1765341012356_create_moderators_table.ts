import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'moderators'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('mod_id')
      table.integer('user_id').unsigned().references('user_id').inTable('users').onDelete('CASCADE')

      table
        .integer('fandom_id')
        .unsigned()
        .references('fandom_id')
        .inTable('fandoms')
        .onDelete('CASCADE')

      table.timestamp('assigned_at')

      table.unique(['fandom_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
