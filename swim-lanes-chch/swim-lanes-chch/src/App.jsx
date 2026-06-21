import { useState, useEffect, useCallback } from 'react'
import {
  POOLS, TIME_SLOTS, TIME_PERIODS,
  rankPoolsForDateTime, getLanesForPool,
  formatDate, isToday, generateCalendarDates,
} from './data.js'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const C = {
  bg: '#0d1b2a',
  bgCard: '#112236',
  bgCard2: '#162b40',
  aqua: '#7ecac3',
  aquaDark: '#3a8a84',
  cream: '#f5ede0',
  creamDim: '#c8b8a4',
  coral: '#e8836a',
  sage: '#8fada0',
  navy: '#1a3a52',
  navyLight: '#2a5070',
  border: '#1e3a52',
  borderLight: '#2a5070',
  text: '#f5ede0',
  textDim: '#8fada0',
  textFaint: '#3d6a82',
}

// ─── UTILITY ─────────────────────────────────────────────────────────────────

function laneScore(lanes, max) {
  if (lanes === null || lanes === undefined) return 'none'
  if (lanes === 0) return 'closed'
  const pct = lanes / max
  if (pct >= 0.75) return 'great'
  if (pct >= 0.45) return 'good'
  if (pct >= 0.2) return 'busy'
  return 'packed'
}

const SCORE_STYLES = {
  great:  { bg: 'rgba(126,202,195,0.12)', text: '#7ecac3', dot: '#7ecac3', label: 'Quiet' },
  good:   { bg: 'rgba(143,173,160,0.12)', text: '#a8c5a0', dot: '#a8c5a0', label: 'Moderate' },
  busy:   { bg: 'rgba(232,131,106,0.10)', text: '#e8836a', dot: '#e8836a', label: 'Busy' },
  packed: { bg: 'rgba(232,131,106,0.08)', text: '#c05a40', dot: '#c05a40', label: 'Packed' },
  closed: { bg: 'rgba(50,50,70,0.3)',     text: '#3d5a6a', dot: '#3d5a6a', label: 'Closed' },
  none:   { bg: 'transparent',            text: '#2a4a5e', dot: '#2a4a5e', label: '–' },
}

function getBestMessage(pool, period, score) {
  const pct = score * 100
  if (pct >= 75) return `${pool.shortName} looks beautifully quiet ${period.label.toLowerCase()} — perfect for lane swimming.`
  if (pct >= 50) return `${pool.shortName} should be comfortable ${period.label.toLowerCase()}. A few lanes free.`
  if (pct >= 25) return `${pool.shortName} might be a bit busy, but worth checking. Try arriving early.`
  return `All pools look busy at this time. Consider shifting your swim earlier or later.`
}

// ─── RIPPLE COMPONENT ─────────────────────────────────────────────────────────

function RippleBadge({ color }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 12, height: 12 }}>
      <span style={{
        position: 'absolute', width: 12, height: 12, borderRadius: '50%',
        background: color, opacity: 0.25,
        animation: 'ripple 2s ease-out infinite',
      }} />
      <span style={{
        position: 'absolute', width: 12, height: 12, borderRadius: '50%',
        background: color, opacity: 0.15,
        animation: 'ripple 2s ease-out infinite 0.6s',
      }} />
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, position: 'relative', zIndex: 1 }} />
    </span>
  )
}

// ─── WAVE HEADER ──────────────────────────────────────────────────────────────

function WaveHeader() {
  return (
    <svg viewBox="0 0 400 60" preserveAspectRatio="none"
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: 60, display: 'block' }}>
      <path d="M0,30 Q50,10 100,30 Q150,50 200,30 Q250,10 300,30 Q350,50 400,30 L400,60 L0,60 Z"
        fill="rgba(126,202,195,0.07)" />
      <path d="M0,40 Q60,20 120,40 Q180,60 240,40 Q300,20 360,40 Q390,50 400,45 L400,60 L0,60 Z"
        fill="rgba(126,202,195,0.04)" />
    </svg>
  )
}

// ─── POOL CHIP ────────────────────────────────────────────────────────────────

function PoolChip({ pool, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: selected ? pool.color + '22' : 'transparent',
      border: `1.5px solid ${selected ? pool.color : C.border}`,
      borderRadius: 20, padding: '6px 14px',
      color: selected ? pool.color : C.textDim,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 13, fontWeight: selected ? 600 : 400,
      cursor: 'pointer', whiteSpace: 'nowrap',
      transition: 'all 0.2s',
    }}>
      {pool.shortName}
    </button>
  )
}

// ─── PERIOD BUTTON ────────────────────────────────────────────────────────────

function PeriodButton({ period, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, background: selected ? C.navy : 'transparent',
      border: `1.5px solid ${selected ? C.aqua : C.border}`,
      borderRadius: 14, padding: '12px 8px',
      color: selected ? C.aqua : C.textDim,
      fontFamily: "'DM Sans', sans-serif",
      cursor: 'pointer', transition: 'all 0.2s',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <span style={{ fontSize: 20 }}>{period.icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{period.label}</span>
      <span style={{ fontSize: 10, opacity: 0.7 }}>{period.sublabel}</span>
    </button>
  )
}

// ─── BEST POOL CARD ───────────────────────────────────────────────────────────

function BestPoolCard({ ranked, period, date }) {
  const best = ranked[0]
  if (!best) return null
  const score = best.score
  const pct = Math.round(score * 100)
  const st = pct >= 75 ? SCORE_STYLES.great : pct >= 45 ? SCORE_STYLES.good : pct >= 20 ? SCORE_STYLES.busy : SCORE_STYLES.packed

  return (
    <div className="fade-up" style={{
      background: `linear-gradient(135deg, ${C.bgCard} 0%, ${C.navy} 100%)`,
      border: `1.5px solid ${best.color}44`,
      borderRadius: 20, padding: '24px 20px',
      position: 'relative', overflow: 'hidden',
      animation: 'pulse-glow 3s ease-in-out infinite',
    }}>
      {/* Ripple decoration */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%',
        background: best.color + '08', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 10, right: 10, width: 60, height: 60, borderRadius: '50%',
        background: best.color + '0c', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.textDim, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
            Best pick right now
          </div>
          <div style={{ fontSize: 26, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: best.color, lineHeight: 1.1 }}>
            {best.name}
          </div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{best.subtitle}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{
            background: st.bg, border: `1px solid ${st.dot}44`,
            borderRadius: 20, padding: '4px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <RippleBadge color={st.dot} />
            <span style={{ color: st.text, fontSize: 12, fontWeight: 600 }}>{st.label}</span>
          </div>
          <div style={{ color: best.color, fontSize: 22, fontWeight: 700 }}>
            ~{Math.round(best.avg)} <span style={{ fontSize: 12, color: C.textDim, fontWeight: 400 }}>lanes free</span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: C.creamDim, lineHeight: 1.6, marginBottom: 16 }}>
        {getBestMessage(best, period, score)}
      </div>

      {/* Quiet meter */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: C.textDim }}>Quietness</span>
          <span style={{ fontSize: 11, color: st.text }}>{pct}%</span>
        </div>
        <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${best.color}88, ${best.color})`,
            borderRadius: 3, transition: 'width 0.8s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {best.features.map(f => (
          <span key={f} style={{
            fontSize: 11, color: C.textDim, background: C.bgCard2,
            border: `1px solid ${C.border}`, borderRadius: 20, padding: '3px 10px',
          }}>{f}</span>
        ))}
      </div>

      <a href={best.url} target="_blank" rel="noreferrer" style={{
        display: 'block', marginTop: 16,
        background: best.color, color: C.bg,
        borderRadius: 12, padding: '11px 0',
        textAlign: 'center', fontSize: 13, fontWeight: 700,
        textDecoration: 'none', letterSpacing: 0.3,
      }}>
        View {best.shortName} →
      </a>
    </div>
  )
}

// ─── POOL ROW ─────────────────────────────────────────────────────────────────

function PoolRow({ pool, rank, avg, score, onSelect, selected }) {
  const pct = Math.round(score * 100)
  const st = pct >= 75 ? SCORE_STYLES.great : pct >= 45 ? SCORE_STYLES.good : pct >= 20 ? SCORE_STYLES.busy : SCORE_STYLES.packed

  return (
    <button onClick={onSelect} style={{
      width: '100%', background: selected ? pool.color + '12' : C.bgCard,
      border: `1.5px solid ${selected ? pool.color : C.border}`,
      borderRadius: 14, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%',
        background: rank === 0 ? pool.color + '22' : C.bgCard2,
        border: `1px solid ${rank === 0 ? pool.color : C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, color: rank === 0 ? pool.color : C.textFaint, fontWeight: 700, flexShrink: 0,
      }}>
        {rank + 1}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: selected ? pool.color : C.text, whiteSpace: 'nowrap' }}>
            {pool.shortName}
          </span>
          {rank === 0 && <span style={{ fontSize: 10, color: pool.color, background: pool.color + '18',
            borderRadius: 20, padding: '1px 8px', fontWeight: 600 }}>Best</span>}
        </div>
        <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${pool.color}66, ${pool.color})`,
            borderRadius: 2, transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: st.text }}>
          ~{Math.round(avg)}
        </div>
        <div style={{ fontSize: 10, color: C.textDim }}>lanes</div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <div style={{
          background: st.bg, borderRadius: 20, padding: '3px 10px',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, display: 'block' }} />
          <span style={{ fontSize: 11, color: st.text, fontWeight: 500 }}>{st.label}</span>
        </div>
      </div>
    </button>
  )
}

// ─── TIMESLOT DETAIL ──────────────────────────────────────────────────────────

function TimeslotDetail({ pool, date, period, onClose }) {
  const lanes = getLanesForPool(pool.id, date)
  const slots = TIME_SLOTS.filter(t => t.hour >= period.hourStart && t.hour < period.hourEnd)
  const slotData = slots.map(slot => {
    const idx = TIME_SLOTS.findIndex(t => t.label === slot.label)
    return { ...slot, lanes: lanes[idx] }
  })

  const best = [...slotData].filter(s => s.lanes !== null && s.lanes !== undefined)
    .sort((a, b) => b.lanes - a.lanes)[0]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(5,12,20,0.92)', zIndex: 200,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 0 env(safe-area-inset-bottom, 0)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.bgCard, borderRadius: '24px 24px 0 0',
        border: `1.5px solid ${pool.color}44`, borderBottom: 'none',
        padding: '24px 20px 32px', width: '100%', maxWidth: 480,
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              {period.icon} {period.label}
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: pool.color, fontWeight: 700 }}>
              {pool.name}
            </div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{formatDate(date)}</div>
          </div>
          <button onClick={onClose} style={{
            background: C.bgCard2, border: 'none', color: C.textDim,
            borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 16,
          }}>✕</button>
        </div>

        {best && (
          <div style={{
            background: 'rgba(126,202,195,0.08)', border: `1px solid ${C.aqua}33`,
            borderRadius: 12, padding: '12px 14px', marginBottom: 20,
          }}>
            <span style={{ color: C.aqua, fontSize: 12, fontWeight: 600 }}>✨ Best slot: </span>
            <span style={{ color: C.cream, fontSize: 13, fontWeight: 600 }}>{best.label}</span>
            <span style={{ color: C.textDim, fontSize: 12 }}> — ~{best.lanes} lanes free</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {slotData.map(slot => {
            const s = laneScore(slot.lanes, pool.maxLanes)
            const st = SCORE_STYLES[s]
            const isBest = best && slot.label === best.label
            return (
              <div key={slot.label} style={{
                background: isBest ? pool.color + '14' : st.bg || C.bgCard2,
                border: `1px solid ${isBest ? pool.color : st.dot + '33'}`,
                borderRadius: 12, padding: '12px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{slot.label}</div>
                  {isBest && <div style={{ color: pool.color, fontSize: 10, marginTop: 2 }}>★ quietest</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: st.text, fontSize: 18, fontWeight: 700 }}>
                    {slot.lanes === null || slot.lanes === undefined ? '—' : slot.lanes}
                  </div>
                  <div style={{ color: C.textDim, fontSize: 10 }}>
                    {slot.lanes === null || slot.lanes === undefined ? '' : 'lanes'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── CALENDAR STRIP ───────────────────────────────────────────────────────────

function CalendarStrip({ selectedDate, onSelect }) {
  const dates = generateCalendarDates()
  // Group by month
  const months = {}
  dates.forEach(d => {
    const key = d.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })
    if (!months[key]) months[key] = []
    months[key].push(d)
  })

  const [openMonth, setOpenMonth] = useState(() => {
    return selectedDate.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })
  })

  const days = ['S','M','T','W','T','F','S']

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
      {/* Month tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', padding: '12px 12px 0',
        gap: 8, scrollbarWidth: 'none' }}>
        {Object.keys(months).slice(0, 12).map(month => (
          <button key={month} onClick={() => setOpenMonth(month)} style={{
            background: openMonth === month ? C.aqua + '18' : 'transparent',
            border: `1px solid ${openMonth === month ? C.aqua : C.border}`,
            borderRadius: 20, padding: '5px 14px', whiteSpace: 'nowrap',
            color: openMonth === month ? C.aqua : C.textDim,
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: openMonth === month ? 600 : 400,
            cursor: 'pointer', flexShrink: 0,
          }}>
            {month.split(' ')[0].slice(0,3)} {month.split(' ')[1].slice(2)}
          </button>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ padding: '12px 12px 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
          {days.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 10, color: C.textFaint, padding: '2px 0', fontWeight: 600 }}>{d}</div>
          ))}
        </div>
        {(() => {
          const monthDates = months[openMonth] || []
          if (!monthDates.length) return null
          const firstDay = monthDates[0].getDay()
          const blanks = Array(firstDay).fill(null)
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {blanks.map((_, i) => <div key={`b${i}`} />)}
              {monthDates.map(d => {
                const sel = d.toDateString() === selectedDate.toDateString()
                const today = isToday(d)
                const isPast = d < new Date(new Date().setHours(0,0,0,0))
                return (
                  <button key={d.toISOString()} onClick={() => !isPast && onSelect(d)} style={{
                    background: sel ? C.aqua : today ? C.navy : 'transparent',
                    border: `1px solid ${sel ? C.aqua : today ? C.aquaDark : 'transparent'}`,
                    borderRadius: 8, padding: '6px 2px',
                    color: sel ? C.bg : today ? C.aqua : isPast ? C.textFaint : C.creamDim,
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: sel ? 700 : 400,
                    cursor: isPast ? 'default' : 'pointer', opacity: isPast ? 0.4 : 1,
                    transition: 'all 0.15s',
                  }}>
                    {d.getDate()}
                  </button>
                )
              })}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ─── UPDATE BUTTON ────────────────────────────────────────────────────────────

function UpdateButton({ onUpdate, loading, lastUpdated }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={onUpdate} disabled={loading} style={{
        background: loading ? C.bgCard2 : C.navy,
        border: `1.5px solid ${loading ? C.border : C.aqua}`,
        borderRadius: 20, padding: '8px 16px',
        color: loading ? C.textDim : C.aqua,
        fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
        cursor: loading ? 'wait' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 7,
        transition: 'all 0.2s',
      }}>
        <span className={loading ? 'spinning' : ''} style={{ fontSize: 14 }}>
          {loading ? '⟳' : '↻'}
        </span>
        {loading ? 'Checking CCC...' : 'Update lanes'}
      </button>
      {lastUpdated && (
        <span style={{ fontSize: 11, color: C.textDim }}>
          Updated {new Date(lastUpdated).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  )
}

// ─── TOAST ────────────────────────────────────────────────────────────────────

function Toast({ message, type }) {
  if (!message) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: type === 'success' ? 'rgba(126,202,195,0.15)' : 'rgba(232,131,106,0.15)',
      border: `1px solid ${type === 'success' ? C.aqua : C.coral}44`,
      borderRadius: 20, padding: '10px 20px',
      color: type === 'success' ? C.aqua : C.coral,
      fontSize: 13, fontWeight: 500, zIndex: 300,
      backdropFilter: 'blur(10px)', whiteSpace: 'nowrap',
      animation: 'fadeUp 0.3s ease',
    }}>
      {type === 'success' ? '✓ ' : '⚠ '}{message}
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS[1]) // Morning default
  const [selectedPool, setSelectedPool] = useState(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [liveData, setLiveData] = useState(null)
  const [toast, setToast] = useState(null)
  const [activePool, setActivePool] = useState(null) // for filter chips

  // Set default period based on current hour
  useEffect(() => {
    const h = new Date().getHours()
    if (h < 8) setSelectedPeriod(TIME_PERIODS[0])
    else if (h < 12) setSelectedPeriod(TIME_PERIODS[1])
    else if (h < 16) setSelectedPeriod(TIME_PERIODS[2])
    else setSelectedPeriod(TIME_PERIODS[3])
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleUpdate = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/lanes')
      const json = await res.json()
      if (json.success) {
        setLiveData(json.data)
        setLastUpdated(json.fetchedAt)
        showToast('Lane data refreshed from CCC', 'success')
      } else {
        showToast('CCC site unavailable — showing estimated data', 'warn')
      }
    } catch {
      showToast('Could not connect — showing estimated data', 'warn')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const ranked = rankPoolsForDateTime(selectedDate, selectedPeriod)
  const filtered = activePool ? ranked.filter(p => p.id === activePool) : ranked
  const bestPool = ranked[0]

  const dateLabel = isToday(selectedDate) ? 'Today' :
    selectedDate.toDateString() === new Date(Date.now() + 86400000).toDateString() ? 'Tomorrow' :
    selectedDate.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div style={{ background: C.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative' }}>

      {/* ── HEADER ── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(180deg, #0a1520 0%, ${C.bg} 100%)`,
        padding: '52px 20px 48px',
      }}>
        <WaveHeader />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, color: C.aqua, fontWeight: 600, letterSpacing: 2,
            textTransform: 'uppercase', marginBottom: 8 }}>
            Ōtautahi Christchurch
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700,
            color: C.cream, lineHeight: 1.15, marginBottom: 6 }}>
            Find your<br />
            <span style={{
              background: `linear-gradient(90deg, ${C.aqua}, #a8e6e1, ${C.aqua})`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmer 3s linear infinite',
            }}>quiet lane</span>
          </h1>
          <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.5 }}>
            Lane swimming across all CCC pools.<br />
            Find the calmest water, right now.
          </p>
        </div>
      </div>

      <div style={{ padding: '0 16px 100px' }}>

        {/* ── UPDATE BUTTON ── */}
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <UpdateButton onUpdate={handleUpdate} loading={loading} lastUpdated={lastUpdated} />
          <a href="https://recandsport.ccc.govt.nz/swim/lane-availability/"
            target="_blank" rel="noreferrer"
            style={{ fontSize: 11, color: C.textDim, textDecoration: 'none' }}>
            CCC site ↗
          </a>
        </div>

        {/* ── DATE SELECTOR ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, letterSpacing: 1,
            textTransform: 'uppercase', marginBottom: 10 }}>When are you swimming?</div>

          {/* Quick date chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {[0, 1, 2, 3, 4, 5, 6].map(offset => {
              const d = new Date(today)
              d.setDate(today.getDate() + offset)
              const sel = d.toDateString() === selectedDate.toDateString()
              const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' :
                d.toLocaleDateString('en-NZ', { weekday: 'short' })
              return (
                <button key={offset} onClick={() => setSelectedDate(d)} style={{
                  flex: 1, background: sel ? C.aqua + '18' : C.bgCard,
                  border: `1.5px solid ${sel ? C.aqua : C.border}`,
                  borderRadius: 12, padding: '8px 4px',
                  color: sel ? C.aqua : C.textDim,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: sel ? 600 : 400,
                  cursor: 'pointer',
                }}>
                  <div>{label}</div>
                  <div style={{ fontSize: 10, marginTop: 2, color: sel ? C.aqua : C.textFaint }}>
                    {d.getDate()}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Calendar toggle */}
          <button onClick={() => setShowCalendar(v => !v)} style={{
            width: '100%', background: showCalendar ? C.navy : C.bgCard,
            border: `1px solid ${showCalendar ? C.aquaDark : C.border}`,
            borderRadius: 12, padding: '10px 14px',
            color: C.textDim, fontFamily: "'DM Sans', sans-serif",
            fontSize: 12, cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>📅 Pick another date{selectedDate > new Date(today.getTime() + 6 * 86400000) ? ` — ${dateLabel}` : ''}</span>
            <span>{showCalendar ? '▲' : '▼'}</span>
          </button>

          {showCalendar && (
            <div style={{ marginTop: 8 }} className="fade-up">
              <CalendarStrip selectedDate={selectedDate} onSelect={d => {
                setSelectedDate(d)
                setShowCalendar(false)
              }} />
            </div>
          )}
        </div>

        {/* ── PERIOD SELECTOR ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, letterSpacing: 1,
            textTransform: 'uppercase', marginBottom: 10 }}>What time of day?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {TIME_PERIODS.map(p => (
              <PeriodButton key={p.id} period={p} selected={selectedPeriod.id === p.id}
                onClick={() => setSelectedPeriod(p)} />
            ))}
          </div>
        </div>

        {/* ── POOL FILTER CHIPS ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, letterSpacing: 1,
            textTransform: 'uppercase', marginBottom: 10 }}>Filter by pool</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            <button onClick={() => setActivePool(null)} style={{
              background: !activePool ? C.aqua + '18' : 'transparent',
              border: `1.5px solid ${!activePool ? C.aqua : C.border}`,
              borderRadius: 20, padding: '6px 14px',
              color: !activePool ? C.aqua : C.textDim,
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              fontWeight: !activePool ? 600 : 400,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}>All pools</button>
            {POOLS.map(pool => (
              <PoolChip key={pool.id} pool={pool} selected={activePool === pool.id}
                onClick={() => setActivePool(activePool === pool.id ? null : pool.id)} />
            ))}
          </div>
        </div>

        {/* ── BEST PICK ── */}
        {!activePool && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, letterSpacing: 1,
              textTransform: 'uppercase', marginBottom: 10 }}>
              {selectedPeriod.icon} Best pool {dateLabel.toLowerCase()} {selectedPeriod.sublabel}
            </div>
            <BestPoolCard ranked={ranked} period={selectedPeriod} date={selectedDate} />
          </div>
        )}

        {/* ── ALL POOLS RANKED ── */}
        <div>
          <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, letterSpacing: 1,
            textTransform: 'uppercase', marginBottom: 10 }}>
            {activePool ? 'Selected pool' : 'All pools ranked by quietness'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((pool, i) => (
              <div key={pool.id}>
                <PoolRow
                  pool={pool}
                  rank={ranked.indexOf(pool)}
                  avg={pool.avg}
                  score={pool.score}
                  selected={selectedPool === pool.id}
                  onSelect={() => {
                    setSelectedPool(pool.id)
                    setShowDetail(true)
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ marginTop: 32, padding: '20px 0', borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 11, color: C.textFaint, lineHeight: 1.7, textAlign: 'center' }}>
            Lane counts are estimates based on CCC published data.<br />
            Tap <strong style={{ color: C.textDim }}>Update lanes</strong> to fetch the latest from the CCC website.<br />
            Always check with the pool before your swim.<br />
            <a href="https://recandsport.ccc.govt.nz/swim/lane-availability/" target="_blank" rel="noreferrer"
              style={{ color: C.aquaDark }}>recandsport.ccc.govt.nz</a> · 03 941 6446
          </p>
        </div>
      </div>

      {/* ── TIMESLOT DETAIL SHEET ── */}
      {showDetail && selectedPool && (
        <TimeslotDetail
          pool={POOLS.find(p => p.id === selectedPool)}
          date={selectedDate}
          period={selectedPeriod}
          onClose={() => setShowDetail(false)}
        />
      )}

      {/* ── TOAST ── */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
