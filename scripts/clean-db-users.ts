/*
 * Automatyczne czyszczenie użytkowników z bazy Prisma
 * - Próbuje wygenerować Prisma Client
 * - W razie błędu EPERM/lock usuwa cache klienta i ponawia generowanie
 * - Wykonuje skrypt usuwający wszystkich użytkowników: scripts/delete-all-prisma-users.ts
 *
 * Uruchomienie:
 *   npx tsx scripts/clean-db-users.ts
 */

import { spawnSync } from 'child_process'
import { rmSync, existsSync } from 'fs'
import { join } from 'path'

function run(cmd: string, args: string[], opts: { cwd?: string } = {}) {
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    cwd: opts.cwd || process.cwd(),
    env: process.env,
  })
  return res
}

function maskUrl(url?: string) {
  if (!url) return 'undefined'
  try {
    const u = new URL(url)
    if (u.password) u.password = '***'
    return u.toString()
  } catch {
    return url
  }
}

async function main() {
  console.log('⚙️  Start: przygotowanie Prisma Client')
  console.log('🔗 DATABASE_URL =', maskUrl(process.env.DATABASE_URL))

  let gen = run('npx', ['prisma', 'generate'])

  if (gen.status !== 0) {
    console.warn('\n⚠️  prisma generate nie powiodło się – próba naprawy cache klienta...')
    try {
      const prismaCache = join(process.cwd(), 'node_modules', '.prisma')
      if (existsSync(prismaCache)) {
        rmSync(prismaCache, { recursive: true, force: true })
        console.log('🧹 Usunięto', prismaCache)
      } else {
        console.log('ℹ️  Brak katalogu cache:', prismaCache)
      }
    } catch (err) {
      console.warn('⚠️  Nie udało się usunąć cache .prisma:', err)
    }

    console.log('⏳ Ponawiam: prisma generate')
    gen = run('npx', ['prisma', 'generate'])
    if (gen.status !== 0) {
      console.error('❌ prisma generate nie powiodło się ponownie. Zatrzymuję.')
      process.exit(gen.status ?? 1)
    }
  }

  console.log('\n🗑️  Uruchamiam czyszczenie użytkowników w bazie (Prisma)...')
  const del = run('npx', ['tsx', 'scripts/delete-all-prisma-users.ts'])
  if (del.status !== 0) {
    console.error('❌ Usuwanie użytkowników nie powiodło się.')
    process.exit(del.status ?? 1)
  }

  console.log('\n✅ Zakończono. Baza użytkowników wyczyszczona.')
}

main().catch((err) => {
  console.error('❌ Krytyczny błąd:', err)
  process.exit(1)
})
