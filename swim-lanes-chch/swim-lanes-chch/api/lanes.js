// api/lanes.js — Vercel serverless function
// Fetches and parses the CCC lane availability page on demand

export default async function handler(req, res) {
  // CORS headers so the frontend can call this
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const url = 'https://recandsport.ccc.govt.nz/swim/lane-availability/'
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SwimLanesChch/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-NZ,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`CCC site returned ${response.status}`)
    }

    const html = await response.text()

    // Parse tables from the HTML
    const parsed = parseLaneTables(html)

    return res.status(200).json({
      success: true,
      fetchedAt: new Date().toISOString(),
      source: url,
      data: parsed,
      rawLength: html.length,
    })
  } catch (err) {
    console.error('Lane fetch error:', err.message)
    return res.status(200).json({
      success: false,
      error: err.message,
      fetchedAt: new Date().toISOString(),
      data: null,
    })
  }
}

// ─── HTML PARSER ──────────────────────────────────────────────────────────────
// CCC renders lane tables as <table> elements inside accordion sections.
// Each section is labelled with a pool name, then has morning/afternoon/evening tables.

function parseLaneTables(html) {
  const result = {}

  // Find all table blocks
  // Tables follow pattern: <table>...<thead>...<tbody>...
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi
  const tables = []
  let tm
  while ((tm = tableRegex.exec(html)) !== null) {
    tables.push(tm[0])
  }

  if (!tables.length) return result

  // For each table, extract headers (dates) and rows (times + lane counts)
  for (const table of tables) {
    const headers = extractTableHeaders(table)
    const rows = extractTableRows(table)

    if (!headers.length || !rows.length) continue

    // Try to detect which pool this table belongs to by scanning nearby HTML
    // (We'll attach to 'parakiore' for confirmed data, others as 'unknown')
    const tableData = { headers, rows }

    // Look for date patterns in headers like "15/6" or "Mon 15/6"
    const dateHeaders = headers.filter(h => /\d+\/\d+/.test(h))
    if (dateHeaders.length) {
      if (!result.parakiore) result.parakiore = []
      result.parakiore.push(tableData)
    }
  }

  return result
}

function extractTableHeaders(tableHtml) {
  const headers = []
  const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi
  let m
  while ((m = thRegex.exec(tableHtml)) !== null) {
    const text = stripTags(m[1]).trim().replace(/\s+/g, ' ')
    if (text) headers.push(text)
  }
  return headers
}

function extractTableRows(tableHtml) {
  const rows = []
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let tm
  while ((tm = trRegex.exec(tableHtml)) !== null) {
    const cells = []
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
    let cm
    while ((cm = tdRegex.exec(tm[1])) !== null) {
      const text = stripTags(cm[1]).trim().replace(/\s+/g, ' ')
      cells.push(text)
    }
    if (cells.length) rows.push(cells)
  }
  return rows
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
}
