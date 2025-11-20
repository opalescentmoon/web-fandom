import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg'

export default class BaseDatabase {
  pool: Pool

  constructor(config: PoolConfig) {
    this.pool = new Pool(config)
  }

  /**
   * Execute a query that modifies data (INSERT, UPDATE, DELETE)
   * @param sql - SQL statement
   * @param params - Parameters for the query
   * @returns Number of affected rows
   */
  async executeAsync(sql: string, params: any[] = []): Promise<number> {
    const client = await this.pool.connect()
    try {
      const result: QueryResult = await client.query(sql, params)
      return result.rowCount ?? 0
    } finally {
      client.release()
    }
  }

  /**
   * Execute a query that retrieves data (SELECT)
   * @param sql - SQL statement
   * @param params - Parameters for the query
   * @returns Result rows
   */
  async queryAsync<T extends QueryResultRow = any>(sql: string, params: any[] = []): Promise<T[]> {
    const client = await this.pool.connect()
    try {
      const result: QueryResult<T> = await client.query(sql, params)
      return result.rows
    } finally {
      client.release()
    }
  }
}
