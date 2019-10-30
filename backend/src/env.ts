export type EnvironmentVariables = {
  PORT: number
  SESSION_SECRET: string
  SESSION_REDIS_PREFIX: string
  REDIS_HOST: string
  REDIS_PORT: number
  DATABASE_HOST: string
  DATABASE_PORT: number
  DATABASE_USER: string
  DATABASE_PASS: string
  DATABASE_NAME: string
}

const env: EnvironmentVariables = {
  PORT: Number(process.env.PORT) || 3000,
  SESSION_SECRET:
    process.env.SESSION_SECRET || 't9x*4J$&ZG8V%6w2#rbQGEXSBXooPh44',
  SESSION_REDIS_PREFIX: process.env.SESSION_REDIS_PREFIX || 'sid:',
  REDIS_HOST: process.env.REDIS_HOST || '',
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
  DATABASE_HOST: process.env.DATABASE_HOST || '',
  DATABASE_PORT: Number(process.env.DATABASE_PORT) || 3306,
  DATABASE_USER: process.env.DATABASE_USER || 'koibito2019',
  DATABASE_PASS: process.env.DATABASE_PASS || 'koibito2019',
  DATABASE_NAME: process.env.DATABASE_NAME || 'koibito2019'
}

if (env.REDIS_HOST === '') {
  throw new Error('No set REDIS_HOST!')
}

if (env.DATABASE_HOST === '') {
  throw new Error('No set DATABASE_HOST!')
}

export default env
