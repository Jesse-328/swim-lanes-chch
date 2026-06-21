import { useState, useEffect, useCallback } from 'react'
import { POOLS, LANE_POOLS, TIME_PERIODS, TIME_SLOTS, getLanesForPool, rankPools, friendlyDate, isToday, next365, isLytteltonOpen } from './data.js'
import { getActiveManualAlerts, mergeAlerts } from './alerts.js'

const C = {
  bg:'#0d1b2a', card:'#112236', card2:'#162b40',
  aqua:'#7ecac3', aquaDim:'#3a8a84',
  cream:'#f5ede0', creamDim:'#c8b8a4',
  coral:'#e8836a', sage:'#8fada0',
  navy:'#1a3a52', navyL:'#2a5070',
  border:'#1e3a52', borderL:'#2a5070',
  text:'#f5ede0', textDim:'#8fada0', textFaint:'#3d6a82',
}

function grade(pct) {
  if (pct >= 75) return { label:'Quiet',    dot:'#7ecac3', bg:'rgba(126,202,195,0.10)', text:'#7ecac3' }
  if (pct >= 45) return { label:'Moderate', dot:'#a8c5a0', bg:'rgba(143,173,160,0.10)', text:'#a8c5a0' }
  if (pct >= 20) return { label:'Busy',     dot:'#e8836a', bg:'rgba(232,131,106,0.10)', text:'#e8836a' }
  if (pct  >  0) return { label:'Packed',   dot:'#c05a40', bg:'rgba(232,100, 80,0.08)', text:'#c05a40' }
  return               { label:'Closed',   dot:'#3d5a6a', bg:'rgba(50,50,70,0.20)',     text:'#3d5a6a' }
}

function Ripple({ color }) {
  return (
    <span style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',width:12,height:12,flexShrink:0}}>
      <span style={{position:'absolute',width:12,height:12,borderRadius:'50%',background:color,opacity:.22,animation:'ripple 2s ease-out infinite'}}/>
      <span style={{position:'absolute',width:12,height:12,borderRadius:'50%',background:color,opacity:.12,animation:'ripple 2s ease-out infinite .7s'}}/>
      <span style={{width:7,height:7,borderRadius:'50%',background:color,position:'relative',zIndex:1}}/>
    </span>
  )
}

function Waves() {
  return (
    <svg viewBox="0 0 400 56" preserveAspectRatio="none"
      style={{position:'absolute',bottom:0,left:0,right:0,width:'100%',height:56,display:'block',pointerEvents:'none'}}>
      <path d="M0,28 Q50,8 100,28 Q150,48 200,28 Q250,8 300,28 Q350,48 400,28 L400,56 L0,56 Z" fill="rgba(126,202,195,0.06)"/>
      <path d="M0,38 Q70,18 140,38 Q210,58 280,38 Q340,22 400,34 L400,56 L0,56 Z" fill="rgba(126,202,195,0.04)"/>
    </svg>
  )
}

function Toast({msg,ok}) {
  return (
    <div style={{position:'fixed',bottom:28,left:'50%',transform:'translateX(-50%)',
      background:ok?'rgba(126,202,195,0.14)':'rgba(232,131,106,0.14)',
      border:`1px solid ${ok?C.aqua:C.coral}44`,borderRadius:20,padding:'10px 22px',
      color:ok?C.aqua:C.coral,fontSize:13,fontWeight:500,zIndex:400,
      backdropFilter:'blur(12px)',whiteSpace:'nowrap',animation:'fadeUp .3s ease'}}>
      {ok?'✓ ':'⚠ '}{msg}
    </div>
  )
}

// ── ALERT BANNER ─────────────────────────────────────────────────────────────
// Completely self-contained. Renders nothing if alerts=[].
// No interaction with any other component.

function AlertBanner({ alerts }) {
  const [dismissed, setDismissed] = useState([])

  if (!alerts || alerts.length === 0) return null

  const visible = alerts.filter(a => !dismissed.includes(a.poolId + a.type))
  if (visible.length === 0) return null

  return (
    <div style={{ marginBottom: 16 }}>
      {visible.map(alert => {
        const pool = POOLS.find(p => p.id === alert.poolId)
        const isClosed = alert.type === 'closed'
        const accentColor = isClosed ? '#e8836a' : '#fbbf24'
        const bgColor = isClosed ? 'rgba(232,131,106,0.08)' : 'rgba(251,191,36,0.08)'
        const borderColor = isClosed ? 'rgba(232,131,106,0.25)' : 'rgba(251,191,36,0.25)'
        const icon = isClosed ? '🔴' : '🟡'

        return (
          <div key={alert.poolId + alert.type}
            className="fade-up"
            style={{
              background: bgColor,
              border: `1px solid ${borderColor}`,
              borderRadius: 14,
              padding: '12px 14px',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}>

            {/* Icon */}
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: accentColor }}>
                  {pool ? pool.shortName : alert.poolId}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: accentColor,
                  background: isClosed ? 'rgba(232,131,106,0.12)' : 'rgba(251,191,36,0.12)',
                  border: `1px solid ${borderColor}`,
                  borderRadius: 20, padding: '1px 8px',
                }}>
                  {isClosed ? 'Closed' : 'Reduced lanes'}
                </span>
              </div>
              <p style={{ fontSize: 12, color: C.creamDim, margin: 0, lineHeight: 1.5 }}>
                {alert.message}
              </p>
              {pool && (
                <a href={pool.url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 11, color: accentColor, textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>
                  Check CCC for updates →
                </a>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setDismissed(d => [...d, alert.poolId + alert.type])}
              style={{
                background: 'none', border: 'none',
                color: C.textFaint, cursor: 'pointer',
                fontSize: 16, padding: '0 2px', flexShrink: 0,
                lineHeight: 1,
              }}
              aria-label="Dismiss alert">
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function PeriodPicker({value,onChange}) {
  return (
    <div style={{display:'flex',gap:8}}>
      {TIME_PERIODS.map(p=>{
        const sel = value.id===p.id
        return (
          <button key={p.id} onClick={()=>onChange(p)} style={{
            flex:1,background:sel?C.navy:'transparent',
            border:`1.5px solid ${sel?C.aqua:C.border}`,
            borderRadius:14,padding:'11px 6px',
            color:sel?C.aqua:C.textDim,cursor:'pointer',transition:'all .2s',
            display:'flex',flexDirection:'column',alignItems:'center',gap:3,
            fontFamily:"'DM Sans',sans-serif",
          }}>
            <span style={{fontSize:20}}>{p.icon}</span>
            <span style={{fontSize:11,fontWeight:600}}>{p.label}</span>
            <span style={{fontSize:10,opacity:.7}}>{p.sublabel}</span>
          </button>
        )
      })}
    </div>
  )
}

function DayStrip({value,onChange}) {
  const days = Array.from({length:7},(_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+i);return d})
  return (
    <div style={{display:'flex',gap:6}}>
      {days.map((d,i)=>{
        const sel=d.toDateString()===value.toDateString()
        const lbl=i===0?'Today':i===1?'Tmrw':d.toLocaleDateString('en-NZ',{weekday:'short'})
        return (
          <button key={i} onClick={()=>onChange(d)} style={{
            flex:1,background:sel?C.aqua+'18':C.card,
            border:`1.5px solid ${sel?C.aqua:C.border}`,
            borderRadius:12,padding:'8px 3px',
            color:sel?C.aqua:C.textDim,cursor:'pointer',
            fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:sel?600:400,
          }}>
            <div>{lbl}</div>
            <div style={{fontSize:10,marginTop:2,color:sel?C.aqua:C.textFaint}}>{d.getDate()}</div>
          </button>
        )
      })}
    </div>
  )
}

function CalModal({value,onChange,onClose}) {
  const dates = next365()
  const months = {}
  dates.forEach(d=>{
    const k=d.toLocaleDateString('en-NZ',{month:'long',year:'numeric'})
    if(!months[k])months[k]=[]
    months[k].push(d)
  })
  const mKeys = Object.keys(months)
  const [mIdx,setMIdx] = useState(()=>{
    const cur=value.toLocaleDateString('en-NZ',{month:'long',year:'numeric'})
    const i=mKeys.indexOf(cur); return i>=0?i:0
  })
  const today=new Date(); today.setHours(0,0,0,0)

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(5,12,20,.88)',zIndex:300,
      display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:'22px 22px 0 0',
        border:`1.5px solid ${C.border}`,borderBottom:'none',
        padding:'20px 18px 36px',width:'100%',maxWidth:480,maxHeight:'85vh',overflowY:'auto'}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:'0 auto 18px'}}/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <button onClick={()=>setMIdx(i=>Math.max(0,i-1))} disabled={mIdx===0}
            style={{background:'none',border:'none',color:mIdx===0?C.textFaint:C.aqua,fontSize:22,cursor:'pointer'}}>‹</button>
          <span style={{color:C.cream,fontSize:14,fontWeight:600}}>{mKeys[mIdx]}</span>
          <button onClick={()=>setMIdx(i=>Math.min(mKeys.length-1,i+1))} disabled={mIdx===mKeys.length-1}
            style={{background:'none',border:'none',color:mIdx===mKeys.length-1?C.textFaint:C.aqua,fontSize:22,cursor:'pointer'}}>›</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:6}}>
          {['S','M','T','W','T','F','S'].map((d,i)=>(
            <div key={i} style={{textAlign:'center',fontSize:10,color:C.textFaint,padding:'2px 0',fontWeight:700}}>{d}</div>
          ))}
        </div>
        {(()=>{
          const mDates=months[mKeys[mIdx]]||[]
          if(!mDates.length)return null
          const blanks=Array(mDates[0].getDay()).fill(null)
          return (
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
              {blanks.map((_,i)=><div key={'b'+i}/>)}
              {mDates.map(d=>{
                const sel=d.toDateString()===value.toDateString()
                const isTod=isToday(d)
                const past=d<today
                const lytOpen=isLytteltonOpen(d)
                return (
                  <button key={d.toISOString()} onClick={()=>{if(!past){onChange(d);onClose()}}} style={{
                    background:sel?C.aqua:isTod?C.navy:'transparent',
                    border:`1px solid ${sel?C.aqua:isTod?C.aquaDim:lytOpen?'#7eb8d422':'transparent'}`,
                    borderRadius:8,padding:'7px 2px',
                    color:sel?C.bg:isTod?C.aqua:past?C.textFaint:C.creamDim,
                    fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:sel?700:400,
                    cursor:past?'default':'pointer',opacity:past?.4:1,transition:'all .12s',
                  }}>
                    {d.getDate()}
                    {lytOpen&&!sel&&<div style={{width:3,height:3,borderRadius:'50%',background:'#7eb8d4',margin:'2px auto 0'}}/>}
                  </button>
                )
              })}
            </div>
          )
        })()}
        <div style={{marginTop:14,display:'flex',alignItems:'center',gap:6,fontSize:11,color:C.textFaint}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:'#7eb8d4',display:'inline-block'}}/>
          Lyttelton pool open (Nov–Mar)
        </div>
      </div>
    </div>
  )
}

function SeasonalPoolCard({ pool, date }) {
  const open = isLytteltonOpen(date)
  const monthsUntilOpen = () => {
    const m = date.getMonth() + 1
    if (m >= 4 && m <= 10) return 11 - m
    return 0
  }
  return (
    <div style={{
      background: C.card,
      border: `1.5px solid ${open ? pool.color + '66' : C.border}`,
      borderRadius: 14, padding: '14px 16px',
      opacity: open ? 1 : 0.75,
    }}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:10,height:10,borderRadius:'50%',flexShrink:0,
          background:open?pool.color:'#3d5a6a',
          boxShadow:open?`0 0 8px ${pool.color}88`:'none'}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
            <span style={{fontSize:13,fontWeight:600,color:open?pool.color:C.textDim}}>{pool.shortName}</span>
            <span style={{fontSize:10,fontWeight:600,
              color:open?pool.color:C.textFaint,
              background:open?pool.color+'18':C.card2,
              border:`1px solid ${open?pool.color+'44':C.border}`,
              borderRadius:20,padding:'1px 8px'}}>
              {open?'🌊 Open now':'❄️ Winter closure'}
            </span>
          </div>
          <div style={{fontSize:11,color:C.textDim}}>
            {open?pool.openMessage:pool.closedMessage}
            {!open&&monthsUntilOpen()>0&&<span style={{color:C.textFaint}}> · {monthsUntilOpen()} months away</span>}
          </div>
        </div>
        <a href={pool.url} target="_blank" rel="noreferrer" style={{
          background:open?pool.color:C.card2,color:open?C.bg:C.textDim,
          border:`1px solid ${open?pool.color:C.border}`,
          borderRadius:10,padding:'6px 12px',fontSize:11,fontWeight:600,textDecoration:'none',flexShrink:0,
        }}>Info →</a>
      </div>
      <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
        {pool.features.map(f=>(
          <span key={f} style={{fontSize:10,color:open?C.textDim:C.textFaint,
            background:C.card2,border:`1px solid ${C.border}`,
            borderRadius:20,padding:'2px 9px'}}>{f}</span>
        ))}
      </div>
      {open&&<div style={{marginTop:10,fontSize:12,color:C.creamDim,lineHeight:1.5}}>{pool.tip}</div>}
    </div>
  )
}

function HeroCard({pool,period,date}) {
  if(!pool) return null
  const pct=Math.round(pool.score*100)
  const g=grade(pct)
  return (
    <div className="fade-up" style={{
      background:`linear-gradient(135deg,${C.card} 0%,${C.navy} 100%)`,
      border:`1.5px solid ${pool.color}44`,borderRadius:22,padding:'22px 20px',
      position:'relative',overflow:'hidden',
      animation:'pulseGlow 3s ease-in-out infinite',
    }}>
      <div style={{position:'absolute',top:-30,right:-30,width:130,height:130,borderRadius:'50%',background:pool.color+'08',pointerEvents:'none'}}/>
      <div style={{position:'absolute',top:14,right:14,width:65,height:65,borderRadius:'50%',background:pool.color+'0c',pointerEvents:'none'}}/>
      <div style={{fontSize:10,color:C.textDim,fontWeight:600,letterSpacing:1.2,textTransform:'uppercase',marginBottom:6}}>
        Best pick · {friendlyDate(date)} · {period.sublabel}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:pool.color,lineHeight:1.1}}>
            {pool.name}
          </div>
          <div style={{fontSize:12,color:C.textDim,marginTop:4}}>{pool.subtitle}</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
          <div style={{background:g.bg,border:`1px solid ${g.dot}44`,borderRadius:20,
            padding:'4px 12px',display:'flex',alignItems:'center',gap:6}}>
            <Ripple color={g.dot}/>
            <span style={{color:g.text,fontSize:12,fontWeight:600}}>{g.label}</span>
          </div>
          <div style={{color:pool.color,fontSize:21,fontWeight:700}}>
            ~{Math.round(pool.avg)} <span style={{fontSize:11,color:C.textDim,fontWeight:400}}>lanes free</span>
          </div>
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
          <span style={{fontSize:11,color:C.textDim}}>Quietness</span>
          <span style={{fontSize:11,color:g.text}}>{pct}%</span>
        </div>
        <div style={{height:5,background:C.border,borderRadius:3,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,
            background:`linear-gradient(90deg,${pool.color}88,${pool.color})`,
            borderRadius:3,transition:'width .8s ease'}}/>
        </div>
      </div>
      <div style={{fontSize:12,color:C.creamDim,lineHeight:1.6,marginBottom:16}}>{pool.tip}</div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:16}}>
        {pool.features.map(f=>(
          <span key={f} style={{fontSize:11,color:C.textDim,background:C.card2,
            border:`1px solid ${C.border}`,borderRadius:20,padding:'3px 10px'}}>{f}</span>
        ))}
      </div>
      <a href={pool.url} target="_blank" rel="noreferrer" style={{
        display:'block',background:pool.color,color:C.bg,
        borderRadius:12,padding:'12px 0',textAlign:'center',
        fontSize:13,fontWeight:700,textDecoration:'none',letterSpacing:.3,
      }}>View {pool.shortName} on CCC site →</a>
    </div>
  )
}

function PoolRow({pool,rank,onSelect,selected}) {
  const pct=Math.round(pool.score*100)
  const g=grade(pct)
  return (
    <button onClick={onSelect} style={{
      width:'100%',background:selected?pool.color+'12':C.card,
      border:`1.5px solid ${selected?pool.color:C.border}`,
      borderRadius:14,padding:'13px 14px',
      display:'flex',alignItems:'center',gap:10,
      cursor:'pointer',transition:'all .2s',textAlign:'left',
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <div style={{width:26,height:26,borderRadius:'50%',flexShrink:0,
        background:rank===0?pool.color+'22':C.card2,
        border:`1px solid ${rank===0?pool.color:C.border}`,
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:11,color:rank===0?pool.color:C.textFaint,fontWeight:700}}>
        {rank+1}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
          <span style={{fontSize:13,fontWeight:600,color:selected?pool.color:C.text}}>{pool.shortName}</span>
          {rank===0&&<span style={{fontSize:10,color:pool.color,background:pool.color+'18',
            borderRadius:20,padding:'1px 8px',fontWeight:600}}>Best</span>}
        </div>
        <div style={{height:3,background:C.border,borderRadius:2,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,
            background:`linear-gradient(90deg,${pool.color}66,${pool.color})`,
            borderRadius:2,transition:'width .5s ease'}}/>
        </div>
      </div>
      <div style={{textAlign:'right',flexShrink:0}}>
        <div style={{fontSize:15,fontWeight:700,color:g.text}}>~{Math.round(pool.avg)}</div>
        <div style={{fontSize:10,color:C.textDim}}>lanes</div>
      </div>
      <div style={{background:g.bg,borderRadius:20,padding:'3px 10px',flexShrink:0,
        display:'flex',alignItems:'center',gap:5}}>
        <span style={{width:6,height:6,borderRadius:'50%',background:g.dot,display:'block'}}/>
        <span style={{fontSize:11,color:g.text,fontWeight:500}}>{g.label}</span>
      </div>
    </button>
  )
}

function SlotSheet({pool,date,period,onClose}) {
  const lanes=getLanesForPool(pool.id,date)
  const slots=TIME_SLOTS.filter(t=>t.hour>=period.hourStart&&t.hour<period.hourEnd)
    .map(slot=>{const i=TIME_SLOTS.findIndex(t=>t.label===slot.label);return{...slot,lanes:lanes[i]}})
  const best=[...slots].filter(s=>s.lanes!==null&&s.lanes!==undefined&&s.lanes>0).sort((a,b)=>b.lanes-a.lanes)[0]
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(5,12,20,.90)',zIndex:200,
      display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.card,borderRadius:'22px 22px 0 0',
        border:`1.5px solid ${pool.color}44`,borderBottom:'none',
        padding:'20px 18px 36px',width:'100%',maxWidth:480,maxHeight:'85vh',overflowY:'auto',
      }}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:'0 auto 18px'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div>
            <div style={{fontSize:10,color:C.textDim,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>
              {period.icon} {period.label} · {friendlyDate(date)}
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:pool.color,fontWeight:700}}>{pool.name}</div>
          </div>
          <button onClick={onClose} style={{background:C.card2,border:'none',color:C.textDim,
            borderRadius:10,padding:'7px 13px',cursor:'pointer',fontSize:15}}>✕</button>
        </div>
        {best&&(
          <div style={{background:'rgba(126,202,195,0.07)',border:`1px solid ${C.aqua}33`,
            borderRadius:12,padding:'11px 14px',marginBottom:18}}>
            <span style={{color:C.aqua,fontSize:12,fontWeight:600}}>✨ Quietest slot: </span>
            <span style={{color:C.cream,fontSize:13,fontWeight:600}}>{best.label}</span>
            <span style={{color:C.textDim,fontSize:12}}> — ~{best.lanes} lanes</span>
          </div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
          {slots.map(slot=>{
            const pct=!slot.lanes||slot.lanes===0?0:Math.round((slot.lanes/pool.maxLanes)*100)
            const g=grade(pct)
            const isBest=best&&slot.label===best.label
            return (
              <div key={slot.label} style={{
                background:isBest?pool.color+'14':g.bg||C.card2,
                border:`1px solid ${isBest?pool.color:g.dot+'33'}`,
                borderRadius:12,padding:'11px 13px',
                display:'flex',justifyContent:'space-between',alignItems:'center',
              }}>
                <div>
                  <div style={{color:C.text,fontSize:13,fontWeight:600}}>{slot.label}</div>
                  {isBest&&<div style={{color:pool.color,fontSize:10,marginTop:2}}>★ quietest</div>}
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{color:g.text,fontSize:18,fontWeight:700}}>
                    {slot.lanes===null||slot.lanes===undefined?'—':slot.lanes===0?'✕':slot.lanes}
                  </div>
                  {slot.lanes>0&&<div style={{color:C.textDim,fontSize:10}}>lanes</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PoolChips({active,onChange}) {
  return (
    <div style={{display:'flex',gap:7,overflowX:'auto',paddingBottom:3,scrollbarWidth:'none'}}>
      <button onClick={()=>onChange(null)} style={{
        background:!active?C.aqua+'18':'transparent',
        border:`1.5px solid ${!active?C.aqua:C.border}`,
        borderRadius:20,padding:'6px 14px',color:!active?C.aqua:C.textDim,
        fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:!active?600:400,
        cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,
      }}>All pools</button>
      {LANE_POOLS.map(p=>(
        <button key={p.id} onClick={()=>onChange(active===p.id?null:p.id)} style={{
          background:active===p.id?p.color+'20':'transparent',
          border:`1.5px solid ${active===p.id?p.color:C.border}`,
          borderRadius:20,padding:'6px 13px',
          color:active===p.id?p.color:C.textDim,
          fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:active===p.id?600:400,
          cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,
        }}>{p.shortName}</button>
      ))}
    </div>
  )
}

function UpdateBtn({onClick,loading,at}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      <button onClick={onClick} disabled={loading} style={{
        background:loading?C.card2:C.navy,
        border:`1.5px solid ${loading?C.border:C.aqua}`,
        borderRadius:20,padding:'8px 16px',
        color:loading?C.textDim:C.aqua,
        fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,
        cursor:loading?'wait':'pointer',
        display:'flex',alignItems:'center',gap:7,transition:'all .2s',
      }}>
        <span className={loading?'spinning':''} style={{fontSize:14,display:'inline-block'}}>↻</span>
        {loading?'Checking CCC…':'Update lanes'}
      </button>
      {at&&<span style={{fontSize:11,color:C.textDim}}>
        Updated {new Date(at).toLocaleTimeString('en-NZ',{hour:'2-digit',minute:'2-digit'})}
      </span>}
    </div>
  )
}

function Label({children}) {
  return <div style={{fontSize:10,color:C.textDim,fontWeight:600,letterSpacing:1.3,
    textTransform:'uppercase',marginBottom:10}}>{children}</div>
}

// ── APP ───────────────────────────────────────────────────────────────────────

export default function App() {
  const todayDate=new Date(); todayDate.setHours(0,0,0,0)
  const [date,setDate]=useState(todayDate)
  const [period,setPeriod]=useState(TIME_PERIODS[1])
  const [activePool,setActivePool]=useState(null)
  const [detailPool,setDetailPool]=useState(null)
  const [showCal,setShowCal]=useState(false)
  const [loading,setLoading]=useState(false)
  const [updatedAt,setUpdatedAt]=useState(null)
  const [toast,setToast]=useState(null)
  const [alerts,setAlerts]=useState(getActiveManualAlerts())

  const lyttelton = POOLS.find(p => p.id === 'lyttelton')

  useEffect(()=>{
    const h=new Date().getHours()
    if(h<8) setPeriod(TIME_PERIODS[0])
    else if(h<12) setPeriod(TIME_PERIODS[1])
    else if(h<16) setPeriod(TIME_PERIODS[2])
    else setPeriod(TIME_PERIODS[3])
  },[])

  const showToast=useCallback((msg,ok=true)=>{
    setToast({msg,ok}); setTimeout(()=>setToast(null),3200)
  },[])

  const doUpdate=useCallback(async()=>{
    setLoading(true)
    try {
      const r=await fetch('/api/lanes')
      const j=await r.json()
      setUpdatedAt(j.fetchedAt)
      // Merge live alerts with manual fallbacks — isolated, no side effects
      const merged = mergeAlerts(j.alerts || [], getActiveManualAlerts())
      setAlerts(merged)
      if(j.success) showToast('Lane data refreshed from CCC ✓')
      else showToast('CCC unavailable — showing estimated data',false)
    } catch {
      showToast('Could not connect — showing estimated data',false)
    } finally { setLoading(false) }
  },[showToast])

  const ranked=rankPools(date,period)
  const filtered=activePool?ranked.filter(p=>p.id===activePool):ranked
  const best=ranked[0]

  return (
    <div style={{background:C.bg,minHeight:'100vh',maxWidth:480,margin:'0 auto',position:'relative'}}>

      {/* Header */}
      <div style={{position:'relative',overflow:'hidden',
        background:`linear-gradient(180deg,#080f1a 0%,${C.bg} 100%)`,
        padding:'54px 20px 50px'}}>
        <Waves/>
        <div style={{position:'relative',zIndex:1}}>
          <div style={{fontSize:10,color:C.aqua,fontWeight:600,letterSpacing:2.5,
            textTransform:'uppercase',marginBottom:10}}>Ōtautahi · Christchurch</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:700,
            color:C.cream,lineHeight:1.15,marginBottom:8}}>
            Find your<br/>
            <span style={{
              background:`linear-gradient(90deg,${C.aqua},#c4f0ed,${C.aqua})`,
              backgroundSize:'200% auto',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
              animation:'shimmer 3s linear infinite',
            }}>quiet lane</span>
          </h1>
          <p style={{fontSize:13,color:C.textDim,lineHeight:1.55}}>
            Lane swimming across all CCC pools.<br/>
            Find the calmest water for your swim.
          </p>
        </div>
      </div>

      <div style={{padding:'0 16px 100px'}}>

        {/* ── ALERT BANNER — slots in here, invisible when empty ── */}
        <div style={{marginTop:4}}>
          <AlertBanner alerts={alerts} />
        </div>

        {/* Update */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
          <UpdateBtn onClick={doUpdate} loading={loading} at={updatedAt}/>
          <a href="https://recandsport.ccc.govt.nz/swim/lane-availability/" target="_blank" rel="noreferrer"
            style={{fontSize:11,color:C.textFaint,textDecoration:'none'}}>CCC site ↗</a>
        </div>

        {/* Date */}
        <div style={{marginBottom:20}}>
          <Label>When are you swimming?</Label>
          <DayStrip value={date} onChange={setDate}/>
          <button onClick={()=>setShowCal(v=>!v)} style={{
            width:'100%',marginTop:8,background:showCal?C.navy:C.card,
            border:`1px solid ${showCal?C.aquaDim:C.border}`,
            borderRadius:12,padding:'10px 14px',color:C.textDim,
            fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:'pointer',
            display:'flex',justifyContent:'space-between',alignItems:'center',
          }}>
            <span>📅 {date>new Date(todayDate.getTime()+6*86400000)?`Viewing ${friendlyDate(date)}`:'Pick another date'}</span>
            <span style={{fontSize:11}}>{showCal?'▲':'▼'}</span>
          </button>
        </div>

        {/* Period */}
        <div style={{marginBottom:20}}>
          <Label>What time of day?</Label>
          <PeriodPicker value={period} onChange={setPeriod}/>
        </div>

        {/* Pool filter */}
        <div style={{marginBottom:20}}>
          <Label>Filter by pool</Label>
          <PoolChips active={activePool} onChange={setActivePool}/>
        </div>

        {/* Best pick */}
        {!activePool&&best&&(
          <div style={{marginBottom:20}}>
            <Label>{period.icon} Best pool {friendlyDate(date).toLowerCase()}</Label>
            <HeroCard pool={best} period={period} date={date}/>
          </div>
        )}

        {/* Ranked list */}
        <div>
          <Label>{activePool?'Selected pool':'All pools · ranked by quietness'}</Label>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {filtered.map((p)=>(
              <PoolRow key={p.id} pool={p} rank={ranked.indexOf(p)}
                selected={detailPool?.id===p.id}
                onSelect={()=>setDetailPool(detailPool?.id===p.id?null:p)}/>
            ))}
          </div>
          <p style={{fontSize:11,color:C.textFaint,marginTop:12,textAlign:'center',lineHeight:1.6}}>
            Tap a pool to see every 30-min slot for {period.label.toLowerCase()}
          </p>
        </div>

        {/* Seasonal pool */}
        <div style={{marginTop:24}}>
          <Label>🌊 Seasonal pool</Label>
          <SeasonalPoolCard pool={lyttelton} date={date}/>
        </div>

        {/* Footer */}
        <div style={{marginTop:32,paddingTop:20,borderTop:`1px solid ${C.border}`,textAlign:'center'}}>
          <p style={{fontSize:11,color:C.textFaint,lineHeight:1.8}}>
            Lane counts are estimates based on published CCC patterns.<br/>
            Tap <strong style={{color:C.textDim}}>Update lanes</strong> to fetch live data.<br/>
            Always confirm with the pool before your swim.<br/>
            <a href="https://recandsport.ccc.govt.nz/" target="_blank" rel="noreferrer"
              style={{color:C.aquaDim}}>recandsport.ccc.govt.nz</a> · 📞 03 941 6446
          </p>
        </div>
      </div>

      {showCal&&<CalModal value={date} onChange={d=>{setDate(d);setShowCal(false)}} onClose={()=>setShowCal(false)}/>}
      {detailPool&&<SlotSheet pool={detailPool} date={date} period={period} onClose={()=>setDetailPool(null)}/>}
      {toast&&<Toast msg={toast.msg} ok={toast.ok}/>}
    </div>
  )
}
