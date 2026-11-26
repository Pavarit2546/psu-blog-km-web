import { config as loadEnv } from 'dotenv'

/** Fail fast with a clear message when the stack or seed data is missing. */
export default async function globalSetup() {
  loadEnv({ quiet: true } as never)
  const base = process.env.PSU_KP_BASE_URL || 'http://localhost:3100'
  let res: Response
  try {
    res = await fetch(`${base}/api/health`)
  } catch {
    throw new Error(`App not reachable at ${base}. Start it first: docker compose up -d`)
  }
  if (!res.ok) throw new Error(`Health check failed (${res.status}) at ${base}/api/health`)
  if (!process.env.SEED_DEMO_PASSWORD) throw new Error('SEED_DEMO_PASSWORD missing from .env')

  const login = await fetch(`${base}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base },
    body: JSON.stringify({ email: 'personnel@demo.psu.local', password: process.env.SEED_DEMO_PASSWORD }),
  })
  if (!login.ok) {
    throw new Error('Demo accounts missing — run: docker compose --profile tools run --rm tools pnpm seed')
  }
}
