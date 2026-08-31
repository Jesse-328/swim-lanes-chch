// /api/lanes — checks the CCC lane-availability page for closure notices.
//
// Honest scope: this is a plain fetch of the page HTML. The lane *tables* are
// rendered by JavaScript and are not visible here (the weekly Puppeteer scraper
// handles those). What this can see is prose — closure and reduced-lane notices
// — so that is all it looks for.

const CCC_URL = 'https://recandsport.ccc.govt.nz/swim/lane-availability/'

export default async function handler(req, res) {
  // Let Vercel's edge serve repeat requests for 5 minutes — kinder to CCC
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

  try {
    const response = await fetch(CCC_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SwimLanesChch/1.2)', Accept: 'text/html' },
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error(`CCC returned ${response.status}`)
    const html = await response.text()
    return res.status(200).json({ success: true, fetchedAt: new Date().toISOString(), alerts: detectAlerts(html) })
  } catch (err) {
    return res.status(200).json({ success: false, error: err.message, fetchedAt: new Date().toISOString(), alerts: [] })
  }
}

// ── Pool name patterns ────────────────────────────────────────────────────────
const POOL_PATTERNS = [
  { id: 'parakiore', patterns: ['parakiore'] },
  { id: 'taiora',    patterns: ['taiora', 'qeii'] },
  { id: 'graham',    patterns: ['graham condon'] },
  { id: 'matatiki',  patterns: ['matatiki', 'hornby'] },
  { id: 'jellie',    patterns: ['jellie park'] },
  { id: 'pioneer',   patterns: ['pioneer'] },
  { id: 'linwood',   patterns: ['te pou toetoe', 'linwood pool'] },
  { id: 'lyttelton', patterns: ['norman kirk', 'lyttelton'] },
]

// Strong phrases only, with a verb: "is closed", "will be closed", "closed until".
// "closing time", "temporarily", or a bare "closure" (as in a news headline) do NOT count.
const CLOSED_RE  = /\b(is|are|remains?|will be|currently|now)\s+(temporarily\s+)?closed\b|\bclosed\s+(for|until|from|due|while|to the public)\b/
const REDUCED_RE = /\breduced\s+(lanes?|capacity|availability)\b|\b(limited|fewer)\s+lanes\b/

function detectAlerts(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    // end a "sentence" at every block/link boundary so nav items never run together
    .replace(/<\/(p|div|li|h[1-6]|a|td|th|tr|section|article|span)>/gi, '. ')
    .replace(/<br\s*\/?>/gi, '. ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')

  // Work sentence by sentence: a notice names the pool and the closure in the
  // same sentence, so there is no bleed from one pool's section into the next.
  const sentences = text.split(/(?<=[.!?])\s+/).map(x => x.replace(/^[.\s]+/, ''))
  const alerts = []

  for (const raw of sentences) {
    const s = raw.trim()
    if (s.length < 15 || s.length > 400) continue
    const lower = s.toLowerCase()
    const pool = POOL_PATTERNS.find(p => p.patterns.some(pat => lower.includes(pat)))
    if (!pool || alerts.some(a => a.poolId === pool.id)) continue

    const type = CLOSED_RE.test(lower) ? 'closed' : REDUCED_RE.test(lower) ? 'reduced' : null
    if (!type) continue

    const message = s.length > 140 ? s.slice(0, 137).replace(/\s+\S*$/, '') + '…' : s
    alerts.push({ poolId: pool.id, type, message, source: 'ccc' })
  }
  return alerts
}
