import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_fandom'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('fandom_id').unsigned()
      // .references('fandom_id')
      // .inTable('fandoms')
      // .onDelete('CASCADE')

      table.integer('user_id').unsigned() // .references('user_id').inTable('users').onDelete('CASCADE')

      table.unique(['fandom_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
