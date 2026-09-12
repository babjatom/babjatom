import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Center, useGLTF } from '@react-three/drei'
import type { Group } from 'three'

const MODEL_URL = `${import.meta.env.BASE_URL}models/tomi.glb`

type Pointer = { x: number; y: number }

function TomiModel({ pointer }: { pointer: RefObject<Pointer> }) {
  const groupRef = useRef<Group>(null)
  const { scene } = useGLTF(MODEL_URL)
  const cloned = useMemo(() => scene.clone(true), [scene])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return

    // Gentle follow: small angles + frame-rate–aware easing (not snappy).
    const targetY = pointer.current.x * 0.22
    const targetX = pointer.current.y * 0.1
    const ease = 1 - Math.exp(-2.2 * delta)
    group.rotation.y += (targetY - group.rotation.y) * ease
    group.rotation.x += (targetX - group.rotation.x) * ease
  })

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={cloned} />
      </Center>
    </group>
  )
}

useGLTF.preload(MODEL_URL)

export function VoxelScene() {
  const pointer = useRef<Pointer>({ x: 0, y: 0 })

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      pointer.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      }
    }

    window.addEventListener('pointermove', onPointerMove)
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [])

  return (
    <div className="relative h-full w-full" role="img" aria-label="3D Tomi scene">
      <div className="voxel-scene absolute inset-0">
        <Canvas
          camera={{ position: [1.05, 1.05, 1.35], fov: 30 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.75} />
          <directionalLight position={[4, 6, 3]} intensity={1.15} />
          <hemisphereLight intensity={0.35} groundColor="#444444" />
          <Suspense fallback={null}>
            <TomiModel pointer={pointer} />
          </Suspense>
        </Canvas>
      </div>
      {/* Soft theme fade — WebGL canvases often ignore CSS masks, so use an overlay */}
      <div
        className="voxel-scene-fade pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[65%]"
        aria-hidden
      />
    </div>
  )
}
