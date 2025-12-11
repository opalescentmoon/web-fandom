import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'poll_options'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('poll_id').unsigned().references('id').inTable('polls').onDelete('CASCADE')
      table.string('option_text')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
