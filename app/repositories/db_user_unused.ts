import BaseDatabase from './baseclass_db.js'

export default class DBUserRepository extends BaseDatabase {
  protected tableName: string = 'users'

  async addUser(username: string, email: string, passwordHash: string): Promise<number> {
    const sql = `INSERT INTO ${this.tableName} (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id`
    const result = await this.executeAsync(sql, [username, email, passwordHash])
    return result
  }

  async getUserByEmail(email: string): Promise<any> {
    const sql = `SELECT * FROM ${this.tableName} WHERE email = $1`
    const results = await this.queryAsync(sql, [email])
    return results[0]
  }

  async getUserById(id: number): Promise<any> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = $1`
    const results = await this.queryAsync(sql, [id])
    return results[0]
  }

  async updateUsername(id: number, name: string): Promise<number> {
    const sql = `UPDATE ${this.tableName} SET name = $1 WHERE id = $2`
    const result = await this.executeAsync(sql, [name, id])
    return result
  }

  async updateUserBio(id: number, bio: string): Promise<number> {
    const sql = `UPDATE ${this.tableName} SET bio = $1 WHERE id = $2`
    const result = await this.executeAsync(sql, [bio, id])
    return result
  }

  async deleteUser(id: number): Promise<number> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = $1`
    const result = await this.executeAsync(sql, [id])
    return result
  }
}
