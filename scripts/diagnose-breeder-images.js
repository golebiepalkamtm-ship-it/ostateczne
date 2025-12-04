/**
 * Diagnostic script for breeder meetings images
 * - Checks SmartImage local-url regex for a known bug
 * - Extracts static image paths from `app/api/breeder-meetings/route.ts`
 * - Verifies corresponding files exist under `public/`
 * - (Optional) Attempts to read DB records via Prisma if DATABASE_URL is set
 *
 * Usage:
 *   node scripts/diagnose-breeder-images.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const repoRoot = path.resolve(__dirname, '..')

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8')
  } catch (e) {
    return null
  }
}

function checkSmartImage() {
  const p = path.join(repoRoot, 'components', 'ui', 'SmartImage.tsx')
  const content = readFileSafe(p)
  if (!content) return { found: false, note: 'SmartImage not found' }

  // Strip comments to avoid matching regex literals mentioned only in comments
  const codeOnly = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  // Look specifically for the literal problematic regex `/^\/[^a]/` in code (not comments)
  const hasProblematicRegex = codeOnly.includes('/^\\/[^a]/')

  const issues = []
  if (hasProblematicRegex) {
    // Debug: show exact matches to help track down false positives
    try {
      const matches = codeOnly.match(/\^\\\/\[\^a\]|\/\^\\\/[\^a]/g)
      if (matches) console.log('DEBUG: matched problematic patterns in SmartImage:', matches)
    } catch (e) {
      // ignore
    }
    issues.push({
      level: 'warn',
      message: 'Found suspicious regex /^\\/[^a]/ in SmartImage. This excludes any local path starting with "/a" (e.g. "/assets/...") and may misclassify local images as remote, causing Next/Image to be used or images not to load.'
    })
  }

  // Also check for IntersectionObserver lazy-loading that might delay images
  if (/IntersectionObserver/.test(content)) {
    issues.push({ level: 'info', message: 'SmartImage uses IntersectionObserver for lazy loading — images outside viewport will not be requested until visible.' })
  }

  return { found: true, issues }
}

function extractStaticPathsFromRoute() {
  const routePath = path.join(repoRoot, 'app', 'api', 'breeder-meetings', 'route.ts')
  const content = readFileSafe(routePath)
  if (!content) return { found: false, paths: [], note: 'route.ts not found' }

  const re = /convertPublicPathToStorageUrl\(\s*['"]([^"']+)['"]\s*\)/g
  let m
  const pathsFound = []
  while ((m = re.exec(content)) !== null) {
    pathsFound.push(m[1])
  }

  return { found: true, paths: Array.from(new Set(pathsFound)) }
}

function checkPublicFiles(pathsList) {
  const results = []
  for (const p of pathsList) {
    // remove leading slash
    const clean = p.startsWith('/') ? p.slice(1) : p
    // because convertPublicPathToStorageUrl may add 'public/' in production,
    // try both with and without leading 'public/'
    const candidates = [clean, clean.replace(/^public\//, ''), `public/${clean}`].map(x => path.join(repoRoot, 'public', decodeURIComponent(x))).filter(Boolean)

    let exists = false
    let foundAt = null
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        exists = true
        foundAt = cand
        break
      }
    }

    results.push({ original: p, exists, foundAt, candidates })
  }
  return results
}

async function tryPrismaDbCheck() {
  // Attempt to connect to Prisma if DATABASE_URL is present
  if (!process.env.DATABASE_URL) {
    return { available: false, note: 'DATABASE_URL not set in environment; skipping DB check' }
  }

  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    const meetings = await prisma.breederMeeting.findMany({ select: { id: true, images: true, title: true } })
    await prisma.$disconnect()

    // parse images field (JSON string) and report any local-ish paths
    const parsed = meetings.map(m => {
      let imgs = []
      try { imgs = JSON.parse(m.images || '[]') } catch { imgs = [] }
      return { id: m.id, title: m.title, images: imgs }
    })
    return { available: true, meetings: parsed }
  } catch (err) {
    return { available: false, error: String(err) }
  }
}

async function main() {
  console.log('\nBreeder Meetings Images Diagnostic Report')
  console.log('Repository root:', repoRoot)

  const smart = checkSmartImage()
  console.log('\n1) SmartImage checks:')
  if (!smart.found) console.log(' - SmartImage component not found')
  else {
    if (smart.issues.length === 0) console.log(' - No immediate issues detected in SmartImage')
    else smart.issues.forEach(i => console.log(` - [${i.level}] ${i.message}`))
  }

  console.log('\n2) Static image paths declared in API route:')
  const extracted = extractStaticPathsFromRoute()
  if (!extracted.found) console.log(' - Could not find route.ts or no paths extracted')
  else {
    console.log(` - Found ${extracted.paths.length} unique static paths`) 
    const checks = checkPublicFiles(extracted.paths)
    for (const c of checks) {
      if (c.exists) console.log(`   ✓ ${c.original} -> exists at ${c.foundAt}`)
      else console.log(`   ✗ ${c.original} -> MISSING (checked candidates: ${c.candidates.map(p=>path.relative(repoRoot,p)).join(', ')})`)
    }
  }

  console.log('\n3) Public folder summary for `public/meetings with breeders`')
  const meetingsDir = path.join(repoRoot, 'public', 'meetings with breeders')
  if (fs.existsSync(meetingsDir)) {
    const breeders = fs.readdirSync(meetingsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
    console.log(` - Found ${breeders.length} subfolders: ${breeders.join(', ')}`)
    for (const b of breeders) {
      const files = fs.readdirSync(path.join(meetingsDir, b)).filter(f => !f.startsWith('.'))
      console.log(`   - ${b}: ${files.length} files`)
    }
  } else {
    console.log(' - public/meetings with breeders folder does not exist')
  }

  console.log('\n4) Optional: database records (Prisma) -- attempting connection...')
  const dbResult = await tryPrismaDbCheck()
  if (!dbResult.available) {
    console.log(' - DB check skipped or failed:', dbResult.note || dbResult.error)
  } else {
    console.log(` - Found ${dbResult.meetings.length} DB meetings`)
    let missingCount = 0
    for (const m of dbResult.meetings) {
      for (const img of m.images) {
        if (typeof img === 'string' && img.startsWith('/')) {
          const candidate = path.join(repoRoot, 'public', decodeURIComponent(img.replace(/^\//, '')))
          if (!fs.existsSync(candidate)) {
            console.log(`   ✗ Meeting ${m.id} (${m.title}): local image ${img} missing on disk`) 
            missingCount++
          }
        }
      }
    }
    if (missingCount === 0) console.log(' - All local image references in DB appear present on disk')
  }

  console.log('\nSummary & Recommendations:')
  console.log(' - If SmartImage contains /^\\/[^a]/, change it to /^\\/ to detect all local paths and rely on explicit isApiRoute detection for /api/')
  console.log(' - Avoid spaces in public asset folder names (use `meetings-with-breeders`) or ensure paths are encoded/normalized when saved')
  console.log(' - In production, convertPublicPathToStorageUrl uses Firebase bucket; ensure uploaded assets are actually uploaded to the configured storage or store public files in CDN')

  console.log('\nDone.')
}

main().catch(e => { console.error('Script error:', e); process.exit(2) })
