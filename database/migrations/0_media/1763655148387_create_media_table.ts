import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'media'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('file_url')
      table.string('media_type')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
