import { Html } from '@react-three/drei'

export default function ScreenIframe() {
  return (
    <Html
      transform
      position={[0, 1.2, 0.5]} // adjust to screen
      rotation={[0, 0, 0]}
      scale={0.5}
      occlude
    >
      <iframe
        src="https://example.com"
        style={{
          width: '800px',
          height: '500px',
          border: 'none'
        }}
      />
    </Html>
  )
}