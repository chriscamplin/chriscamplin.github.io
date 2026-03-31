import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function useFitGroupToViewport(
  contentRef,
  groupRef,
  { margin = 0.92, damping = 6, maxScale = 1, referenceDistance = 24 } = {}
) {
  const { camera, size } = useThree()

  const box = useMemo(() => new THREE.Box3(), [])
  const boxSize = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const content = contentRef.current
    const group = groupRef.current

    if (!content || !group || !camera.isPerspectiveCamera) {
      return
    }

    box.setFromObject(content)

    if (box.isEmpty()) {
      return
    }

    box.getSize(boxSize)

    const currentScale = Math.max(group.scale.x, 0.0001)
    const naturalWidth = boxSize.x / currentScale
    const naturalHeight = boxSize.y / currentScale

    if (naturalWidth <= 0 || naturalHeight <= 0) {
      return
    }

    const aspect = size.width / Math.max(size.height, 1)
    const fov = THREE.MathUtils.degToRad(camera.fov)
    const viewportHeight = 2 * Math.tan(fov * 0.5) * referenceDistance
    const viewportWidth = viewportHeight * aspect

    const targetScale = Math.min(
      maxScale,
      (viewportWidth * margin) / naturalWidth,
      (viewportHeight * margin) / naturalHeight
    )

    if (!Number.isFinite(targetScale) || targetScale <= 0) {
      return
    }

    const dampedScale = THREE.MathUtils.damp(group.scale.x, targetScale, damping, delta)
    group.scale.setScalar(dampedScale)
  })
}
