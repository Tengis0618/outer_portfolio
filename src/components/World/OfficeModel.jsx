import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'

export default function OfficeModel() {

    const CAMERA_PRESETS = {
    computer: {
      target: [0.8, 1.2, 0],
      radius: 2.2,
      theta: Math.PI * 0.55,
      phi: Math.PI / 3
    },
    frame: {
      target: [-1, 1.5, 0],
      radius: 2.5,
      theta: Math.PI * 0.6,
      phi: Math.PI / 3
    },
    default: {
      target: [0, 0, 0],
      radius: 5,
      theta: Math.PI * 0.55,
      phi: Math.PI / 3
    }
  }
  const { scene } = useGLTF('/assets/models/office.glb')
  const { camera } = useThree()

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())

    // Center model
    scene.position.sub(center)
  }, [scene])

  useEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh) return

      // Enable raycasting
      child.castShadow = true
      child.receiveShadow = true

      // 👉 Identify meshes by name (IMPORTANT)
      if (child.name.toLowerCase().includes('computer')) {
        child.userData.clickAction = 'computer'
      }

      if (child.name.toLowerCase().includes('frame')) {
        child.userData.clickAction = 'frame'
      }
    })
  }, [scene])

  const handleClick = (e) => {
    e.stopPropagation()

    const mesh = e.object
    const action = mesh.userData.clickAction

    if (!action) return

    const preset = CAMERA_PRESETS[action]

    window.dispatchEvent(
      new CustomEvent('focusObject', {
        detail: preset
      })
    )
  }

  return <primitive object={scene} handleClick={handleClick}/>
}