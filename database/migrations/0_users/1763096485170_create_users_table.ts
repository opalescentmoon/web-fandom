import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('user_id').notNullable()
      table.string('user_name').notNullable().unique()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.string('display_name').notNullable()
      table.text('bio').nullable()
      table.string('profile_picture').nullable()

      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
