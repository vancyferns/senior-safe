import { Pool } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL?.trim()

let pool

export const isDatabaseConfigured = () => Boolean(connectionString)

export const getPool = () => {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured')
  }

  if (!pool) {
    pool = new Pool({ connectionString })
  }

  return pool
}

export const query = (text, params = []) => {
  return getPool().query(text, params)
}

export const withClient = async (callback) => {
  const client = await getPool().connect()

  try {
    return await callback(client)
  } finally {
    client.release()
  }
}

export const transaction = async (callback) => {
  return withClient(async (client) => {
    await client.query('BEGIN')

    try {
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
}
