import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddPostIdToMedia extends BaseSchema {
  protected tableName = 'media'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('post_id')
        .unsigned()
        .nullable()
        .references('post_id')
        .inTable('posts')
        .onDelete('CASCADE')
        .index()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('post_id')
    })
  }
}
