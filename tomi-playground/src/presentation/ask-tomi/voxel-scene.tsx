import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, useGLTF } from '@react-three/drei'
import type { Group } from 'three'
import { isWebGLAvailable } from '@/infrastructure/webgl'

const MODEL_URL = `${import.meta.env.BASE_URL}models/tomi.glb`
/** Radians per second — steady spin, a bit quicker than a lazy turntable. */
const ROTATE_SPEED = 1.1

/**
 * Production cards are tall/narrow. The previous lookAt(y=0.42) aimed well above a
 * model centered near y=-0.28, so the bust sat in the bottom of the frustum (and
 * under the waist fade). Keep look-at near the actual head.
 */
function CameraFrame() {
  const { camera } = useThree()
  useFrame(() => {
    camera.lookAt(0, 0.18, 0)
  })
  return null
}

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
    // Slight drop so the soft fade covers the waist cut — not enough to leave frame.
    <group position={[0, -0.06, 0]} rotation={[-0.08, 0, 0]}>
      <group ref={groupRef}>
        <Center>
          <primitive object={cloned} />
        </Center>
      </group>
    </group>
  )
}

function VoxelSceneFallback({ reason }: { reason: 'unsupported' | 'error' }) {
  return (
    <div className="flex h-full w-full items-center justify-center px-4 text-center">
      <p className="max-w-[14rem] text-sm text-muted-foreground">
        {reason === 'unsupported'
          ? '3D preview needs WebGL. Check that your GPU drivers are working, then refresh.'
          : '3D preview failed to load.'}
      </p>
    </div>
  )
}

/** Catches sync render failures from Canvas / the GLB tree. */
class SceneErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    // Parent swaps in VoxelSceneFallback once `onError` flips state.
    if (this.state.hasError) return null
    return this.props.children
  }
}

function VoxelCanvas() {
  useEffect(() => {
    useGLTF.preload(MODEL_URL)
  }, [])

  return (
    <Canvas
      // Slightly lower + farther camera frames a bust in a tall aspect ratio.
      camera={{ position: [0.55, 0.12, 1.55], fov: 32 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 3]} intensity={1.15} />
      <hemisphereLight intensity={0.35} groundColor="#444444" />
      <CameraFrame />
      <Suspense fallback={null}>
        <TomiModel />
      </Suspense>
    </Canvas>
  )
}

export function VoxelScene() {
  const [failed, setFailed] = useState(false)
  const webglOk = useMemo(() => isWebGLAvailable(), [])

  return (
    <div className="relative h-full w-full" role="img" aria-label="3D Tomi scene">
      <div className="voxel-scene absolute inset-0">
        {!webglOk || failed ? (
          <VoxelSceneFallback reason={webglOk ? 'error' : 'unsupported'} />
        ) : (
          <SceneErrorBoundary onError={() => setFailed(true)}>
            <VoxelCanvas />
          </SceneErrorBoundary>
        )}
      </div>
      {/* Soft theme fade — hides the waist cutoff (shorter so the bust stays visible) */}
      <div
        className="voxel-scene-fade pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[42%]"
        aria-hidden
      />
    </div>
  )
}
