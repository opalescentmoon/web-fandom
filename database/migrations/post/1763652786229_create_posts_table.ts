import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'posts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('user_id').inTable('users').onDelete('CASCADE')

      table
        .integer('fandom_id')
        .unsigned()
        .references('fandom_id')
        .inTable('fandoms')
        .onDelete('CASCADE')

      table
        .integer('content_id')
        .unsigned()
        .references('id')
        .inTable('contents')
        .onDelete('CASCADE')

      table.string('post_type').notNullable()
      table.check('post_type IN ("normal", "poll")')

      table
        .integer('parent_id')
        .unsigned()
        .references('id')
        .inTable('posts')
        .onDelete('CASCADE')
        .nullable()

      table.text('caption').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
