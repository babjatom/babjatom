import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { track } from '@/infrastructure/analytics'
import { isWebGLAvailable } from '@/infrastructure/webgl'
import { VoxelScene } from '@/presentation/voxel-scene'

vi.mock('@react-three/fiber', () => ({
  Canvas: () => {
    throw new Error('Canvas should not mount without WebGL')
  },
  useFrame: () => {},
  useThree: () => ({ camera: { lookAt: vi.fn() } }),
}))

vi.mock('@react-three/drei', () => ({
  Center: ({ children }: { children: ReactNode }) => children,
  useGLTF: Object.assign(() => ({ scene: { clone: () => ({}) } }), {
    preload: vi.fn(),
  }),
}))

describe('isWebGLAvailable', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false when getContext yields no GL context', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    expect(isWebGLAvailable()).toBe(false)
  })

  it('returns true when webgl2 is available', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (type: string) =>
        type === 'webgl2' ? ({} as WebGL2RenderingContext) : null,
    )
    expect(isWebGLAvailable()).toBe(true)
  })
})

describe('VoxelScene', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.mocked(track).mockClear()
  })

  it('skips Canvas and reports unsupported when WebGL is missing', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    render(<VoxelScene />)

    expect(screen.getByRole('img', { name: '3D Tomi scene' })).toBeInTheDocument()
    expect(
      screen.getByText(/3D preview needs WebGL/i),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(track).toHaveBeenCalledWith('Voxel Scene Loaded', {
        status: 'unsupported',
      })
    })
  })
})
