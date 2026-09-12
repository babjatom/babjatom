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
        camera={{ position: [2.5, 1.8, 3.2], fov: 40 }}
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
          minDistance={1.5}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={0.55}
        />
      </Canvas>
    </div>
  )
}
