import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Center, ContactShadows, useGLTF } from '@react-three/drei'
import type { Group } from 'three'

const MODEL_URL = `${import.meta.env.BASE_URL}models/tomi.glb`

type Pointer = { x: number; y: number }

function TomiModel({ pointer }: { pointer: RefObject<Pointer> }) {
  const groupRef = useRef<Group>(null)
  const { scene } = useGLTF(MODEL_URL)
  const cloned = useMemo(() => scene.clone(true), [scene])

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    const targetY = pointer.current.x * 0.55
    const targetX = pointer.current.y * 0.28
    group.rotation.y += (targetY - group.rotation.y) * 0.1
    group.rotation.x += (targetX - group.rotation.x) * 0.1
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
    <div className="h-full w-full" role="img" aria-label="3D Tomi scene">
      <Canvas
        camera={{ position: [1.15, 0.85, 1.45], fov: 32 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[4, 6, 3]} intensity={1.15} />
        <hemisphereLight intensity={0.35} groundColor="#444444" />
        <Suspense fallback={null}>
          <TomiModel pointer={pointer} />
          <ContactShadows opacity={0.35} scale={12} blur={2.5} far={8} />
        </Suspense>
      </Canvas>
    </div>
  )
}
