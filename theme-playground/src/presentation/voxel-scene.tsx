import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Center, ContactShadows, OrbitControls, useGLTF } from '@react-three/drei'

const MODEL_URL = `${import.meta.env.BASE_URL}models/tomi.glb`

function TomiModel() {
  const { scene } = useGLTF(MODEL_URL)
  const cloned = useMemo(() => scene.clone(true), [scene])

  return (
    <Center>
      <primitive object={cloned} />
    </Center>
  )
}

useGLTF.preload(MODEL_URL)

export function VoxelScene() {
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
          <TomiModel />
          <ContactShadows opacity={0.35} scale={12} blur={2.5} far={8} />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={0.8}
          maxDistance={6}
          target={[0, 0.15, 0]}
        />
      </Canvas>
    </div>
  )
}
