import { useState, useEffect, useRef } from 'react'

export default function StartOverlay({ onEnter }) {
  const [visible, setVisible] = useState(true)
  const [phase, setPhase] = useState('static')   // static → vhs → fadeout
  const [loaded, setLoaded] = useState(false)
  const [time, setTime] = useState('')
  const [blink, setBlink] = useState(true)
  const [trackingShift, setTrackingShift] = useState(0)
  const [staticOpacity, setStaticOpacity] = useState(1)
  const [glitchLine, setGlitchLine] = useState(30)
  const audioCtx = useRef(null)
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  // boot: static → vhs after 1.8s
  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('vhs')
      setLoaded(true)
    }, 1800)
    return () => clearTimeout(t)
  }, [])

  // live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const ss = String(now.getSeconds()).padStart(2, '0')
      setTime(`${hh}:${mm}:${ss}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // blinking elements
  useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 700)
    return () => clearInterval(id)
  }, [])

  // tracking distortion — random horizontal shift
  useEffect(() => {
    const id = setInterval(() => {
      setTrackingShift(Math.random() < 0.15 ? (Math.random() - 0.5) * 18 : 0)
      setGlitchLine(Math.floor(Math.random() * 100))
    }, 120)
    return () => clearInterval(id)
  }, [])

  // static noise canvas
  useEffect(() => {
    if (phase !== 'static') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let running = true

    const draw = () => {
      if (!running) return
      const w = canvas.width = canvas.offsetWidth
      const h = canvas.height = canvas.offsetHeight
      const img = ctx.createImageData(w, h)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255
        img.data[i] = v
        img.data[i+1] = v
        img.data[i+2] = v
        img.data[i+3] = 255
      }
      ctx.putImageData(img, 0, 0)
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      running = false
      cancelAnimationFrame(animRef.current)
    }
  }, [phase])

  // audio hiss using Web Audio API
  const playHiss = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtx.current = ctx
      const bufferSize = ctx.sampleRate * 1.5
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.04
      const source = ctx.createBufferSource()
      source.buffer = buffer
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(1, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5)
      source.connect(gain)
      gain.connect(ctx.destination)
      source.start()
    } catch(e) {}
  }

  const handleEnter = () => {
    playHiss()
    setPhase('fadeout')
    // brief static flash before full fade
    setTimeout(() => {
      setVisible(false)
      onEnter?.()
    }, 1200)
  }

  if (!visible) return null

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).replace(/\//g, '.')

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: '#000',
      fontFamily: '"Share Tech Mono", "VT323", "Courier New", monospace',
      overflow: 'hidden',
      cursor: phase === 'vhs' ? 'pointer' : 'default',
      transition: phase === 'fadeout' ? 'opacity 1.2s ease' : 'none',
      opacity: phase === 'fadeout' ? 0 : 1,
    }}>

      {/* ── STATIC PHASE ── */}
      {phase === 'static' && (
        <>
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          {/* boot text flicker */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}>
            <div style={{
              color: blink ? '#fff' : 'transparent',
              fontSize: '13px',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              textShadow: '0 0 8px #fff',
            }}>
              LOADING TAPE...
            </div>
          </div>
        </>
      )}

      {/* ── VHS PHASE ── */}
      {phase === 'vhs' && (
        <>
          {/* dark base with slight warm tint */}
          <div style={{ position: 'absolute', inset: 0, background: '#080808' }} />

          {/* scanlines */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.45) 0px, rgba(0,0,0,0.45) 1px, transparent 1px, transparent 3px)',
          }} />

          {/* tracking glitch line */}
          <div style={{
            position: 'absolute',
            top: `${glitchLine}%`,
            left: 0, right: 0,
            height: '2px',
            background: 'rgba(255,255,255,0.06)',
            zIndex: 2,
            pointerEvents: 'none',
            transform: `translateX(${trackingShift * 0.5}px)`,
          }} />

          {/* horizontal tracking distortion bands */}
          {trackingShift !== 0 && (
            <div style={{
              position: 'absolute',
              top: `${glitchLine - 2}%`,
              left: 0, right: 0,
              height: '6px',
              background: 'rgba(180,220,255,0.07)',
              zIndex: 2,
              pointerEvents: 'none',
              transform: `translateX(${trackingShift}px)`,
              filter: 'blur(1px)',
            }} />
          )}

          {/* vignette */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
          }} />

          {/* ── TOP HUD ── */}
          <div style={{
            position: 'absolute', top: '28px', left: '32px', zIndex: 5,
            display: 'flex', flexDirection: 'column', gap: '5px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '9px', height: '9px', borderRadius: '50%',
                background: blink ? '#ff2222' : 'transparent',
                border: '1px solid #ff2222',
              }} />
              <span style={{ color: '#ff2222', fontSize: '12px', letterSpacing: '3px' }}>PLAY ▶</span>
            </div>
            <span style={{ color: '#ccc', fontSize: '11px', letterSpacing: '1px', opacity: 0.7 }}>
              SP · HI-FI · STEREO
            </span>
          </div>

          <div style={{
            position: 'absolute', top: '28px', right: '32px', zIndex: 5, textAlign: 'right',
          }}>
            <div style={{ color: '#ccc', fontSize: '11px', letterSpacing: '2px', opacity: 0.8 }}>
              {dateStr}
            </div>
            <div style={{ color: '#ccc', fontSize: '13px', letterSpacing: '2px', fontVariantNumeric: 'tabular-nums' }}>
              {time}
            </div>
            <div style={{ color: '#888', fontSize: '10px', letterSpacing: '1px', marginTop: '3px' }}>
              CAM 01 · CH 4
            </div>
          </div>

          {/* ── TAPE COUNTER ── */}
          <div style={{
            position: 'absolute', top: '28px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 5, textAlign: 'center',
          }}>
            <div style={{ color: '#888', fontSize: '11px', letterSpacing: '3px' }}>T-120</div>
            <div style={{ color: '#ccc', fontSize: '13px', letterSpacing: '2px', fontVariantNumeric: 'tabular-nums' }}>
              00:{String(new Date().getSeconds()).padStart(2,'0')}:00
            </div>
          </div>

          {/* ── MAIN CONTENT ── */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 4,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            transform: `translateX(${trackingShift * 0.3}px)`,
            transition: 'transform 0.05s',
          }}>

            {/* archive label */}
            <div style={{
              color: '#aaa',
              fontSize: '10px',
              letterSpacing: '5px',
              textTransform: 'uppercase',
              marginBottom: '20px',
              opacity: 0.6,
              borderTop: '1px solid #333',
              borderBottom: '1px solid #333',
              padding: '6px 20px',
            }}>
              Archive Record · Personal File
            </div>

            {/* subject name */}
            <div style={{
              color: '#f0f0e8',
              fontSize: 'clamp(32px, 6vw, 62px)',
              letterSpacing: '6px',
              textTransform: 'uppercase',
              textShadow: `
                0 0 30px rgba(255,255,220,0.15),
                ${trackingShift * 0.1}px 0 0 rgba(255,80,80,0.3),
                ${-trackingShift * 0.1}px 0 0 rgba(80,80,255,0.3)
              `,
              lineHeight: 1.1,
              marginBottom: '8px',
              textAlign: 'center',
            }}>
              TENGIS TEMUULEN
            </div>

            {/* role */}
            <div style={{
              color: '#aaa',
              fontSize: 'clamp(11px, 1.5vw, 14px)',
              letterSpacing: '6px',
              textTransform: 'uppercase',
              marginBottom: '40px',
              textAlign: 'center',
            }}>
              Software Engineer &nbsp;/&nbsp; Researcher
            </div>

            {/* thin divider */}
            <div style={{
              width: '220px', height: '1px',
              background: 'linear-gradient(90deg, transparent, #555, transparent)',
              marginBottom: '40px',
            }} />

            {/* description */}
            <div style={{
              color: '#888',
              fontSize: '11px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              textAlign: 'center',
              lineHeight: '2',
              marginBottom: '48px',
              maxWidth: '380px',
            }}>
              Interactive 3D Office Portfolio<br />
              <span style={{ color: '#555' }}>Tengis Temuulen · {new Date().getFullYear()}</span>
            </div>

            {/* PLAY button */}
            <button
              onClick={handleEnter}
              style={{
                background: 'transparent',
                color: '#e0e0d0',
                border: '1px solid #555',
                padding: '14px 56px',
                fontSize: '12px',
                letterSpacing: '5px',
                textTransform: 'uppercase',
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#e0e0d0'
                e.currentTarget.style.color = '#000'
                e.currentTarget.style.borderColor = '#e0e0d0'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#e0e0d0'
                e.currentTarget.style.borderColor = '#555'
              }}
            >
              ▶ &nbsp; PLAY
            </button>

            <div style={{
              marginTop: '20px',
              color: '#444',
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              press play to begin · click anywhere to explore
            </div>

          </div>

          {/* ── BOTTOM HUD ── */}
          <div style={{
            position: 'absolute', bottom: '28px', left: '32px', zIndex: 5,
            color: '#555', fontSize: '10px', letterSpacing: '1px', lineHeight: '1.9',
          }}>
            <div>TRACKING: AUTO</div>
            <div>HEAD: CLEAN</div>
          </div>

          <div style={{
            position: 'absolute', bottom: '28px', right: '32px', zIndex: 5,
            color: '#555', fontSize: '10px', letterSpacing: '1px',
            textAlign: 'right', lineHeight: '1.9',
          }}>
            <div>RES 1080i</div>
            <div>TAPE OK</div>
          </div>

          {/* bottom center — tape hiss label */}
          <div style={{
            position: 'absolute', bottom: '28px', left: '50%',
            transform: 'translateX(-50%)', zIndex: 5,
            color: blink ? '#444' : '#333',
            fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            ◈ &nbsp; audio hiss · analog &nbsp; ◈
          </div>

        </>
      )}

    </div>
  )
}