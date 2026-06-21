export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const response = await fetch('https://recandsport.ccc.govt.nz/swim/lane-availability/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SwimLanesChch/1.0)', 'Accept': 'text/html' },
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error(`CCC returned ${response.status}`)
    const html = await response.text()

    const tables = parseTables(html)
    const alerts = detectAlerts(html)

    return res.status(200).json({ success: true, fetchedAt: new Date().toISOString(), tables, alerts })
  } catch (err) {
    return res.status(200).json({ success: false, error: err.message, fetchedAt: new Date().toISOString(), tables: [], alerts: [] })
  }
}

// ── Pool name patterns to watch for ──────────────────────────────────────────
const POOL_PATTERNS = [
  { id: 'parakiore', patterns: ['parakiore'] },
  { id: 'taiora',    patterns: ['taiora', 'qeii', 'q e ii'] },
  { id: 'graham',    patterns: ['graham condon', 'graham'] },
  { id: 'matatiki',  patterns: ['matatiki', 'hornby'] },
  { id: 'jellie',    patterns: ['jellie'] },
  { id: 'pioneer',   patterns: ['pioneer'] },
  { id: 'linwood',   patterns: ['linwood', 'te pou toetoe'] },
  { id: 'lyttelton', patterns: ['lyttelton', 'norman kirk'] },
]

// ── Closure keywords ──────────────────────────────────────────────────────────
const CLOSURE_KEYWORDS = [
  'closed', 'closure', 'maintenance', 'closing', 'unavailable',
  'not available', 'out of service', 'temporarily', 'suspended'
]

const REDUCED_KEYWORDS = [
  'reduced', 'limited lanes', 'fewer lanes', 'reduced capacity', 'reduced lanes'
]

function detectAlerts(html) {
  const alerts = []
  // Strip tags and normalise whitespace for easier scanning
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()

  // Scan a window of text around each pool name for closure keywords
  for (const pool of POOL_PATTERNS) {
    for (const pattern of pool.patterns) {
      const idx = text.indexOf(pattern)
      if (idx === -1) continue

      // Look 300 chars either side of pool name mention
      const window = text.slice(Math.max(0, idx - 50), idx + 350)

      const closureMatch = CLOSURE_KEYWORDS.find(k => window.includes(k))
      const reducedMatch = REDUCED_KEYWORDS.find(k => window.includes(k))

      if (closureMatch) {
        // Extract a snippet for the message — clean it up
        const snippet = extractSnippet(window, closureMatch)
        if (snippet && !alerts.find(a => a.poolId === pool.id)) {
          alerts.push({ poolId: pool.id, type: 'closed', message: snippet, source: 'ccc' })
        }
      } else if (reducedMatch) {
        const snippet = extractSnippet(window, reducedMatch)
        if (snippet && !alerts.find(a => a.poolId === pool.id)) {
          alerts.push({ poolId: pool.id, type: 'reduced', message: snippet, source: 'ccc' })
        }
      }
    }
  }

  return alerts
}

function extractSnippet(window, keyword) {
  const idx = window.indexOf(keyword)
  if (idx === -1) return null
  // Grab ~80 chars from keyword onwards, capitalise first letter
  let snippet = window.slice(idx, idx + 90).trim()
  // Clean up — remove extra spaces, truncate at sentence end if possible
  snippet = snippet.replace(/\s+/g, ' ').trim()
  const dotIdx = snippet.indexOf('.')
  if (dotIdx > 20 && dotIdx < 80) snippet = snippet.slice(0, dotIdx + 1)
  if (snippet.length > 80) snippet = snippet.slice(0, 77) + '…'
  return snippet.charAt(0).toUpperCase() + snippet.slice(1)
}

function parseTables(html) {
  const results = []
  const tRe = /<table[\s\S]*?<\/table>/gi
  let tm; while ((tm = tRe.exec(html)) !== null) {
    const rows = []; const rRe = /<tr[\s\S]*?<\/tr>/gi
    let rm; while ((rm = rRe.exec(tm[0])) !== null) {
      const cells = []; const cRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
      let cm; while ((cm = cRe.exec(rm[0])) !== null)
        cells.push(cm[1].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim())
      if (cells.length) rows.push(cells)
    }
    if (rows.length > 1) results.push(rows)
  }
  return results
}
