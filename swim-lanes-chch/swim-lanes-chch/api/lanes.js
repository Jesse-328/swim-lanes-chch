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
    return res.status(200).json({ success: true, fetchedAt: new Date().toISOString(), tables })
  } catch (err) {
    return res.status(200).json({ success: false, error: err.message, fetchedAt: new Date().toISOString(), tables: [] })
  }
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
