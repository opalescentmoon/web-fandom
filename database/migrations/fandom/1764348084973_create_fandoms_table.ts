import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fandoms'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('fandom_id')

      table.string('fandom_name')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
