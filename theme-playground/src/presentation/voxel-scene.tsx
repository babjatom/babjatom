import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Center, useGLTF } from '@react-three/drei'
import type { Group } from 'three'

const MODEL_URL = `${import.meta.env.BASE_URL}models/tomi.glb`
/** Radians per second — steady spin, a bit quicker than a lazy turntable. */
const ROTATE_SPEED = 1.1

function TomiModel() {
  const groupRef = useRef<Group>(null)
  const { scene } = useGLTF(MODEL_URL)
  const cloned = useMemo(() => scene.clone(true), [scene])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    group.rotation.y += delta * ROTATE_SPEED
  })

  return (
    <group ref={groupRef} position={[0, -0.22, 0]}>
      <Center>
        <primitive object={cloned} />
      </Center>
    </group>
  )
}

useGLTF.preload(MODEL_URL)

export function VoxelScene() {
  return (
    <div className="relative h-full w-full" role="img" aria-label="3D Tomi scene">
      <div className="voxel-scene absolute inset-0">
        <Canvas
          camera={{ position: [0.95, 0.95, 1.2], fov: 28 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.75} />
          <directionalLight position={[4, 6, 3]} intensity={1.15} />
          <hemisphereLight intensity={0.35} groundColor="#444444" />
          <Suspense fallback={null}>
            <TomiModel />
          </Suspense>
        </Canvas>
      </div>
      {/* Soft theme fade — hides the waist cutoff */}
      <div
        className="voxel-scene-fade pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[65%]"
        aria-hidden
      />
    </div>
  )
}
