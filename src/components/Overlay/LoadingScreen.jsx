export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      color: '#4afa4a', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'monospace',
      fontSize: '13px', letterSpacing: '3px', zIndex: 99
    }}>
      LOADING FEED...
    </div>
  )
}