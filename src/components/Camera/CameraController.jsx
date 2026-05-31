import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export default function CameraController({ controlsRef }) {
  const { camera } = useThree()

  const INITIAL_THETA = Math.PI * 0.55
  const CENTER_THETA = Math.PI * 0.55
  const RANGE = Math.PI / 3
  const MIN_THETA = CENTER_THETA - RANGE / 2
  const MAX_THETA = CENTER_THETA + RANGE / 2

  const target = useRef(new THREE.Vector3(0, 0, 0))

  const spherical = useRef({
    radius: 5,
    theta: INITIAL_THETA,
    phi: Math.PI / 3
  })

  const targetSpherical = useRef({ ...spherical.current })

  const [isAnimating, setIsAnimating] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const isUserInteracting = useRef(false)

  const isLocked = useRef(false)
  const lockedPosition = useRef(new THREE.Vector3())

  const updateCamera = () => {
    const s = spherical.current

    const x = s.radius * Math.sin(s.phi) * Math.sin(s.theta)
    const y = s.radius * Math.cos(s.phi)
    const z = s.radius * Math.sin(s.phi) * Math.cos(s.theta)

    camera.position.set(
      target.current.x + x,
      target.current.y + y,
      target.current.z + z
    )

    camera.lookAt(target.current)
  }

  useEffect(() => {
    updateCamera()
  }, [])

  // 🎯 Focus handler
  useEffect(() => {
    const handler = (e) => {
      const { target: t, position, radius, theta, phi } = e.detail

      target.current.set(...t)

      if (position) {
        isLocked.current = true
        lockedPosition.current.set(...position)

        camera.position.copy(lockedPosition.current)
        camera.lookAt(target.current)

        setIsFocused(true)
        setIsAnimating(false)
        return
      }

      isLocked.current = false

      if (radius !== undefined) targetSpherical.current.radius = radius
      if (theta !== undefined) targetSpherical.current.theta = theta
      if (phi !== undefined) targetSpherical.current.phi = phi

      setIsAnimating(true)
      setIsFocused(true)

      window.dispatchEvent(
        new CustomEvent('cameraFocusChanged', {
          detail: { isFocused: true }   // 🔥 force correct value
        })
      )
    }

    window.addEventListener('focusObject', handler)
    return () => window.removeEventListener('focusObject', handler)
  }, [])

  // 🎯 Reset handler
  useEffect(() => {
    const reset = () => {
      isLocked.current = false
      setIsFocused(false)
      setIsAnimating(true)

      window.dispatchEvent(
        new CustomEvent('cameraFocusChanged', {
          detail: { isFocused: false }  // 🔥 correct value
        })
      )

      target.current.set(0, 0, 0)

      targetSpherical.current = {
        radius: 5,
        theta: INITIAL_THETA,
        phi: Math.PI / 3
      }
    }

    window.addEventListener('resetCamera', reset)
    return () => window.removeEventListener('resetCamera', reset)
  }, [])

  // 🎯 Controls sync
  useEffect(() => {
    if (!controlsRef?.current) return

    const controls = controlsRef.current

    const onStart = () => {
      isUserInteracting.current = true
      setIsAnimating(false)
      setIsFocused(false)
      isLocked.current = false
    }

    const onEnd = () => {
      isUserInteracting.current = false
    }

    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)

    return () => {
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
    }
  }, [controlsRef])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (isLocked.current) {
      camera.position.copy(lockedPosition.current)
      camera.lookAt(target.current)
      return
    }

    if (controlsRef?.current && isUserInteracting.current && !isAnimating && !isFocused) {
      const offset = new THREE.Vector3().subVectors(
        camera.position,
        controlsRef.current.target
      )

      const s = new THREE.Spherical().setFromVector3(offset)

      spherical.current.radius = s.radius
      spherical.current.theta = THREE.MathUtils.clamp(s.theta, MIN_THETA, MAX_THETA)
      spherical.current.phi = s.phi

      target.current.copy(controlsRef.current.target)
      return
    }

    // idle
    if (!isUserInteracting.current && !isAnimating && !isLocked.current && !isFocused) {
      const range = RANGE / 2
      spherical.current.theta =
        CENTER_THETA + Math.sin(t * 0.2) * range * 0.9
    }

    // animation
    if (!isUserInteracting.current && isAnimating) {
      spherical.current.radius = THREE.MathUtils.lerp(
        spherical.current.radius,
        targetSpherical.current.radius,
        0.05
      )

      spherical.current.theta = THREE.MathUtils.lerp(
        spherical.current.theta,
        targetSpherical.current.theta,
        0.05
      )

      spherical.current.phi = THREE.MathUtils.lerp(
        spherical.current.phi,
        targetSpherical.current.phi,
        0.05
      )
    }

    spherical.current.theta = THREE.MathUtils.clamp(
      spherical.current.theta,
      MIN_THETA,
      MAX_THETA
    )

    updateCamera()

    if (controlsRef?.current) {
      controlsRef.current.target.copy(target.current)
      controlsRef.current.update()
    }

    // stop animation cleanly
    const rDone = Math.abs(spherical.current.radius - targetSpherical.current.radius) < 0.001
    const tDone = Math.abs(spherical.current.theta - targetSpherical.current.theta) < 0.001
    const pDone = Math.abs(spherical.current.phi - targetSpherical.current.phi) < 0.001

    if (rDone && tDone && pDone) {
      spherical.current = { ...targetSpherical.current }
      setIsAnimating(false)
    }
  })

  return null
}