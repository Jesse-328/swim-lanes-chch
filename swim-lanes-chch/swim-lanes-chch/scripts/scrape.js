#!/usr/bin/env node
/**
 * scrape.js — CCC Lane Availability Scraper
 *
 * Reads https://recandsport.ccc.govt.nz/swim/lane-availability/ with Puppeteer
 * and writes src/lanes.json with, for every pool it can find:
 *
 *   dates   — CCC's actual published columns, keyed by date ("2026-09-05"),
 *             kept for the last KEEP_DAYS days so a "typical week" can be derived
 *   pattern — typical lanes per 30-min slot per day-of-week (0=Sun … 6=Sat),
 *             the median across every retained date for that weekday
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
const KEEP_DAYS = 35   // how far back to retain dated columns (feeds the pattern)

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

// ── Dates ─────────────────────────────────────────────────────────────────────
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

// Today's date in NZ as "YYYY-MM-DD" (the runner is in UTC)
function todayNZ() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
}
const toKey = d => d.toISOString().slice(0, 10)          // Date(UTC midnight) → "YYYY-MM-DD"
const fromKey = k => new Date(k + 'T00:00:00Z')
const daysBetween = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000)

// "Sat 29/8" → { dow: 6, key: "2026-08-29" }   ·   "Sat" → { dow: 6, key: null }
// Tolerant of whatever the rendered header looks like: "Sat\n29/8", "Sat, 29/08",
// "Sat 29.8", "Saturday 29 Aug". The header has no year, so pick the year that
// puts the date near today AND whose weekday matches the label.
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
function parseDayHeader(text, today) {
  const t = text.replace(/\s+/g, ' ').trim()
  const dm = t.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)/i)
  if (!dm) return null
  const dow = DOW.indexOf(dm[1].toLowerCase())

  let day = null, month = null
  let m = t.match(/(\d{1,2})\s*[\/.\-]\s*(\d{1,2})/)
  if (m) { day = +m[1]; month = +m[2] }
  else {
    m = t.match(/(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)
    if (m) { day = +m[1]; month = MONTHS.indexOf(m[2].toLowerCase()) + 1 }
  }
  if (!day || !month) return { dow, key: null }

  const y = +today.slice(0, 4)
  for (const year of [y, y + 1, y - 1]) {
    const d = new Date(Date.UTC(year, month - 1, day))
    if (d.getUTCMonth() !== month - 1) continue            // e.g. 31/9 doesn't exist
    const delta = daysBetween(today, toKey(d))
    if (delta < -60 || delta > 330) continue
    if (d.getUTCDay() !== dow) continue
    return { dow, key: toKey(d) }
  }
  return { dow, key: null }                                 // weekday only, undated
}

// ── Cell parsers ──────────────────────────────────────────────────────────────

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
    await page.setUserAgent('Mozilla/5.0 (compatible; SwimLanesChch/1.2)')
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

// One pool's tables → { "2026-09-05": [31 slots], … } for every dated column.
// Undated columns (weekday only) are returned separately keyed by dow.
function parseTables(tables, today) {
  const byDate = {}    // key → { hour → lanes }
  const byDowOnly = {} // dow → { hour → [lanes] }   (fallback if CCC drops the dates)
  let cells = 0

  for (const table of tables) {
    if (!table.length) continue
    const cols = table[0].slice(1).map(h => parseDayHeader(h, today))
    for (let r = 1; r < table.length; r++) {
      const row = table[r]
      const hour = parseTimeLabel(row[0] || '')
      if (hour === null) continue                        // mode row ("50m"), blank, "9.00pm"
      cols.forEach((col, ci) => {
        if (!col) return
        const lanes = parseLaneCell(row[ci + 1] || '')
        if (lanes === null) return
        cells++
        if (col.key) (byDate[col.key] ??= {})[hour] = lanes
        else ((byDowOnly[col.dow] ??= {})[hour] ??= []).push(lanes)
      })
    }
  }
  if (!cells) return null

  const dates = {}
  for (const [key, slots] of Object.entries(byDate))
    dates[key] = SLOT_HOURS.map(h => slots[h] ?? null)

  const dowOnly = {}
  for (const [dow, slots] of Object.entries(byDowOnly))
    dowOnly[dow] = SLOT_HOURS.map(h => {
      const v = slots[h]
      return v?.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null
    })

  return { dates, dowOnly }
}

const median = arr => {
  const s = [...arr].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

// Typical week from all retained dated columns (median per slot per weekday).
// Falls back to undated columns, then to the previous pattern.
function buildPattern(dates, dowOnly, previous) {
  const pattern = {}
  for (let d = 0; d <= 6; d++) {
    const samples = Object.entries(dates)
      .filter(([key]) => fromKey(key).getUTCDay() === d)
      .map(([, slots]) => slots)
    pattern[d] = SLOT_HOURS.map((_, i) => {
      const vals = samples.map(s => s[i]).filter(v => v !== null)
      if (vals.length) return median(vals)
      if (dowOnly[d]?.[i] != null) return dowOnly[d][i]
      return previous?.[d]?.[i] ?? null
    })
  }
  return pattern
}

// ── Main ──────────────────────────────────────────────────────────────────────
const today = todayNZ()
const existing = existsSync(OUT_PATH) ? JSON.parse(readFileSync(OUT_PATH, 'utf8')) : { pools: {} }

const sections = await fetchSections()
console.log(`Today (NZ): ${today}`)
console.log('Sections found:', sections.map(s => `${s.name} (${s.tables.length} tables)`).join(' · '))

const pools = {}
const scraped = [], kept = []

// Carry every existing pool forward first (closed pools, anything not on the page)
for (const [id, p] of Object.entries(existing.pools)) pools[id] = p

for (const section of sections) {
  const id = poolIdFromName(section.name)
  if (!id) continue
  const rawHeader = section.tables[0]?.[0] || []
  console.log(`${id.padEnd(9)}    header: ${JSON.stringify(rawHeader)}`)
  const parsed = parseTables(section.tables, today)
  if (!parsed) {
    kept.push(id)
    console.log(`${id.padEnd(9)} –  no lane table (closed?) — keeping existing data`)
    continue
  }

  // Merge: new dated columns replace same-date old ones; old ones kept for KEEP_DAYS
  const prev = existing.pools[id] || {}
  const dates = { ...(prev.dates || {}), ...parsed.dates }
  for (const key of Object.keys(dates))
    if (daysBetween(key, today) > KEEP_DAYS) delete dates[key]

  const pattern = buildPattern(dates, parsed.dowOnly, prev.pattern)
  pools[id] = { pattern, dates: Object.fromEntries(Object.entries(dates).sort()) }
  scraped.push(id)

  const keys = Object.keys(parsed.dates).sort()
  const undated = Object.keys(parsed.dowOnly).length
  console.log(`${id.padEnd(9)} ✓  ${keys.length ? `${keys.length} dated cols (${keys[0]} → ${keys.at(-1)})` : 'NO dated cols'}${undated ? `, ${undated} undated` : ''}, ${Object.keys(dates).length} retained`)
}

if (!scraped.length) {
  console.error('ERROR: no pools scraped — leaving lanes.json untouched')
  process.exit(1)
}

// ── Write ─────────────────────────────────────────────────────────────────────
const note = 'AUTO-GENERATED by scripts/scrape.js. Lanes open to the public per 30-min slot. ' +
  'dates = CCC published columns by date; pattern = typical week by day-of-week (0=Sun). null = no data / not open.'
const lines = ['{', `  "scrapedAt": ${JSON.stringify(new Date().toISOString())},`, `  "note": ${JSON.stringify(note)},`, '  "pools": {']
const ids = Object.keys(pools)
ids.forEach((id, i) => {
  const p = pools[id]
  lines.push(`    ${JSON.stringify(id)}: {`)
  lines.push('      "pattern": {')
  for (let d = 0; d <= 6; d++) lines.push(`        "${d}": ${JSON.stringify(p.pattern[d])}${d < 6 ? ',' : ''}`)
  lines.push('      },')
  lines.push('      "dates": {')
  const dk = Object.keys(p.dates || {})
  dk.forEach((k, j) => lines.push(`        ${JSON.stringify(k)}: ${JSON.stringify(p.dates[k])}${j < dk.length - 1 ? ',' : ''}`))
  lines.push('      }')
  lines.push(`    }${i < ids.length - 1 ? ',' : ''}`)
})
lines.push('  }', '}')
writeFileSync(OUT_PATH, lines.join('\n') + '\n')

console.log(`\n✓ Wrote ${OUT_PATH}`)
console.log(`  scraped: ${scraped.join(', ')}`)
if (kept.length) console.log(`  kept existing: ${kept.join(', ')}`)
