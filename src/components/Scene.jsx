import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei'
import Office from './World/Office'
import CameraController from './Camera/CameraController'
import { useRef, useState, useEffect } from 'react'

export default function Scene() {
  const controlsRef = useRef()

  const CENTER_THETA = Math.PI * 0.55
  const RANGE = Math.PI / 3

  return (
    <>
      <color attach="background" args={['#eaeaea']} />

      {/* Lights */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

      {/*<Environment preset="city" /> */}

      <ContactShadows
        position={[0, -1, 0]}
        opacity={0.4}
        scale={10}
        blur={2.5}
        far={4}
      />

      <Office/>

      <CameraController controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.2}
        minAzimuthAngle={CENTER_THETA - RANGE / 2}
        maxAzimuthAngle={CENTER_THETA + RANGE / 2}
        minDistance={0.2}
        maxDistance={6}
      />

      {/* invisible ground click reset */}
      <mesh
        onClick={() => {
          window.dispatchEvent(new Event('resetCamera'))
        }}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </>
  )
}