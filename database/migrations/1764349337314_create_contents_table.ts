import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contents'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('content_id')
      table.string('content_name')
      table.string('content_branch')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
