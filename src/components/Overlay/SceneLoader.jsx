import { useEffect } from "react"

export default function SceneLoader({ onLoad }) {
  useEffect(() => {
    return () => onLoad()  // fires when Suspense resolves
  }, [])
  return null  // ✅ returns nothing, R3F is happy
}