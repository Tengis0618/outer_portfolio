import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useEffect, useRef } from 'react'
import Scene from './components/Scene'
import StartOverlay from './components/Overlay/StartOverlay'
import LoadingScreen from './components/Overlay/LoadingScreen'
import SceneLoader from './components/Overlay/SceneLoader'

export default function App() {
  const [isFocused, setIsFocused] = useState(false)
  const [entered, setEntered] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const audioRef = useRef(null)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const handler = (e) => setIsFocused(e.detail.isFocused)
    window.addEventListener('cameraFocusChanged', handler)
    return () => window.removeEventListener('cameraFocusChanged', handler)
  }, [])

  useEffect(() => {
    if (!entered) return

    const audio = new Audio('/assets/sounds/bg_sound.mp3')
    audio.loop = true
    audio.volume = 0.3
    audioRef.current = audio
    audio.play().catch(() => {})  // catch needed — browsers block autoplay without user gesture

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [entered])

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !muted
      setMuted(m => !m)
    }
  }

  return (
    <>
      {!entered && <StartOverlay onEnter={() => setEntered(true)} />}

      {entered && !sceneReady && <LoadingScreen />}

      {/* ✅ Canvas only mounts after user clicks enter — iframe never exists during overlay */}
      {entered && (
        <Canvas
          camera={{ position: [2.5, 1.5, 4], fov: 50 }}
          gl={{ antialias: true }}
          shadows
        >
          <Suspense fallback={ <SceneLoader onLoad={() => setSceneReady(true)} /> }>
            <Scene />
          </Suspense>
        </Canvas>
      )}

      {isFocused && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: 20,
            padding: '10px 16px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            zIndex: 9999
          }}
          onClick={() => window.dispatchEvent(new Event('resetCamera'))}
        >
          ⬅ Back
        </div>
      )}

      <div
        onClick={toggleMute}
        style={{
          position: 'fixed', bottom: 20, right: 20,
          background: 'rgba(0,0,0,0.7)', color: 'white',
          padding: '8px 14px', borderRadius: '8px',
          cursor: 'pointer', zIndex: 9999,
          fontFamily: 'monospace', fontSize: '12px', letterSpacing: '2px'
        }}
      >
        {muted ? '🔇 MUTED' : '🔊 SOUND'}
      </div>
    </>
  )
}