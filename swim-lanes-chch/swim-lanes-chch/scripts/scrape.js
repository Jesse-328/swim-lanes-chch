#!/usr/bin/env node
/**
 * scrape.js — CCC Lane Availability Scraper
 *
 * Reads https://recandsport.ccc.govt.nz/swim/lane-availability/ with Puppeteer
 * and writes src/lanes.json: lanes open to the public per 30-min slot, per
 * day-of-week (0=Sun … 6=Sat), for every pool it can find.
 *
 * Pools that can't be parsed keep whatever is already in lanes.json.
 * Pool names, tips, colours etc. live in src/data.js and are never touched here.
 */

import puppeteer from 'puppeteer'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, '..', 'src', 'lanes.json')
const CCC_URL = 'https://recandsport.ccc.govt.nz/swim/lane-availability/'

// ── Time slots (must match src/data.js) ──────────────────────────────────────
const SLOT_HOURS = [
  5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5,
  12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5,
  18, 18.5, 19, 19.5, 20, 20.5,
]

// ── Pool name → id ────────────────────────────────────────────────────────────
const POOL_MATCHERS = [
  ['parakiore', 'parakiore'],
  ['graham',    'graham'],
  ['jellie',    'jellie'],
  ['matatiki',  'matatiki'], ['hornby', 'matatiki'],
  ['pioneer',   'pioneer'],
  ['taiora',    'taiora'],   ['qeii', 'taiora'],
  ['linwood',   'linwood'],  ['te pou', 'linwood'],
]
function poolIdFromName(name) {
  const n = name.toLowerCase()
  const hit = POOL_MATCHERS.find(([needle]) => n.includes(needle))
  return hit ? hit[1] : null
}

// ── Cell parsers ──────────────────────────────────────────────────────────────

// "Mon 31/8" → 1, "Sun" → 0, anything else → null
function parseDayHeader(text) {
  const m = text.replace(/\s+/g, ' ').trim().match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)/i)
  if (!m) return null
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(m[1].toLowerCase().slice(0, 3))
}

// "5.30am" / "5:30am" / "12.00pm" → decimal hour, else null
function parseTimeLabel(text) {
  const m = text.replace(/\s+/g, '').match(/^(\d{1,2})[.:](\d{2})(am|pm)$/i)
  if (!m) return null
  let h = parseInt(m[1], 10)
  const mins = parseInt(m[2], 10)
  const pm = m[3].toLowerCase() === 'pm'
  if (pm && h !== 12) h += 12
  if (!pm && h === 12) h = 0
  return h + (mins >= 30 ? 0.5 : 0)
}

// A lane count is a bare integer, optionally bolded ("**12**").
// Anything else — "-", "T", "25m", "8:15am", "" — is not a lane count → null.
function parseLaneCell(text) {
  const t = text.replace(/\*/g, '').replace(/\u00a0/g, ' ').trim()
  if (!/^\d{1,2}$/.test(t)) return null
  return parseInt(t, 10)
}

// ── Scrape ────────────────────────────────────────────────────────────────────
async function fetchSections() {
  console.log('Launching browser…')
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  })
  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (compatible; SwimLanesChch/1.1)')
    console.log('Loading CCC page…')
    await page.goto(CCC_URL, { waitUntil: 'networkidle2', timeout: 30000 })
    await page.waitForSelector('table.js-make-table-scrollable', { timeout: 20000 })
    await new Promise(r => setTimeout(r, 2000))

    // Read tables *inside* each accordion, so the pool ↔ table link is structural
    return await page.evaluate(() => {
      const cellText = td => (td.innerText || td.textContent || '').trim()
      return [...document.querySelectorAll('.c-accordion-alt')].map(acc => {
        const h = acc.querySelector('[class*="heading"]')
        return {
          name: h ? h.innerText.trim() : '',
          tables: [...acc.querySelectorAll('table.js-make-table-scrollable')].map(t =>
            [...t.querySelectorAll('tr')].map(tr => [...tr.querySelectorAll('td,th')].map(cellText))
          ),
        }
      })
    })
  } finally {
    await browser.close()
  }
}

// One pool's tables → { 0:[…31], 1:[…31], … 6:[…31] } or null if nothing parsed
function buildPoolDays(tables) {
  // byDay[dow][hour] = [counts…]  (a day can appear twice in CCC's 8-day window)
  const byDay = {}
  let cells = 0

  for (const table of tables) {
    if (!table.length) continue
    const dayCols = table[0].slice(1).map(parseDayHeader)
    for (let r = 1; r < table.length; r++) {
      const row = table[r]
      const hour = parseTimeLabel(row[0] || '')
      if (hour === null) continue                 // mode row ("50m"), blank, "9.00pm" etc.
      dayCols.forEach((dow, ci) => {
        if (dow === null) return
        const lanes = parseLaneCell(row[ci + 1] || '')
        if (lanes === null) return
        ;(byDay[dow] ??= {})[hour] ??= []
        byDay[dow][hour].push(lanes)
        cells++
      })
    }
  }
  if (!cells) return null

  const days = {}
  for (let d = 0; d <= 6; d++) {
    days[d] = SLOT_HOURS.map(h => {
      const v = byDay[d]?.[h]
      return v?.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null
    })
  }
  return days
}

// ── Main ──────────────────────────────────────────────────────────────────────
const existing = existsSync(OUT_PATH)
  ? JSON.parse(readFileSync(OUT_PATH, 'utf8'))
  : { pools: {} }

const sections = await fetchSections()
console.log('Sections found:', sections.map(s => `${s.name} (${s.tables.length} tables)`).join(' · '))

const pools = { ...existing.pools }
const scraped = [], kept = []

for (const section of sections) {
  const id = poolIdFromName(section.name)
  if (!id) continue
  const days = buildPoolDays(section.tables)
  if (days) {
    pools[id] = days
    scraped.push(id)
    console.log(`${id.padEnd(9)} ✓  Mon 9am–11am:`, days[1].slice(7, 12), ' Sun:', days[0].slice(7, 12))
  } else {
    kept.push(id)
    console.log(`${id.padEnd(9)} –  no lane table (closed?) — keeping existing data`)
  }
}

if (!scraped.length) {
  console.error('ERROR: no pools scraped — leaving lanes.json untouched')
  process.exit(1)
}

const out = {
  scrapedAt: new Date().toISOString(),
  note: 'AUTO-GENERATED by scripts/scrape.js. Lanes open to the public per 30-min slot, per day-of-week (0=Sun). null = no data / not open.',
  pools,
}

// Compact-but-readable JSON: one line per day
const lines = ['{', `  "scrapedAt": ${JSON.stringify(out.scrapedAt)},`, `  "note": ${JSON.stringify(out.note)},`, '  "pools": {']
const ids = Object.keys(pools)
ids.forEach((id, i) => {
  lines.push(`    ${JSON.stringify(id)}: {`)
  for (let d = 0; d <= 6; d++) lines.push(`      "${d}": ${JSON.stringify(pools[id][d])}${d < 6 ? ',' : ''}`)
  lines.push(`    }${i < ids.length - 1 ? ',' : ''}`)
})
lines.push('  }', '}')
writeFileSync(OUT_PATH, lines.join('\n') + '\n')

console.log(`\n✓ Wrote ${OUT_PATH}`)
console.log(`  scraped: ${scraped.join(', ')}`)
if (kept.length) console.log(`  kept existing: ${kept.join(', ')}`)
