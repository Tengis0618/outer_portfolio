import { useThree } from '@react-three/fiber'
import { useMemo } from 'react'

export default function Ground() {
  const { camera } = useThree()

  const size = useMemo(() => {
    const distance = camera.position.y + 1 // distance to ground
    const fov = (camera.fov * Math.PI) / 180

    const height = 2 * Math.tan(fov / 2) * distance
    const width = height * camera.aspect

    return [width * 2, height * 2] // extra padding
  }, [camera])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color="white" />
    </mesh>
  )
}