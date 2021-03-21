import * as THREE from 'three'
import * as React from 'react'
import { RootTag } from 'react-reconciler'

import { _createRenderer as createRenderer, _createLoop as createLoop } from '@react-three/fiber'
import type { RenderProps } from '@react-three/fiber'
import type { Root } from '@react-three/fiber/src/core/renderer'

import { toTree } from './helpers/tree'
import { toGraph } from './helpers/graph'
import { is } from './helpers/is'

import { createStore, context } from './createMockStore'
import { createCanvas } from './createTestCanvas'
import { createWebGLContext } from './createWebGLContext'
import { createEventFirer } from './fireEvent'

import type { MockUseStoreState, MockScene } from './types/internal'
import type { CreateOptions, Renderer, Act } from './types/public'
import { wrapFiber } from './createTestInstance'

const mockRoots = new Map<HTMLCanvasElement, Root>()
const modes = ['legacy', 'blocking', 'concurrent']
const { advance, invalidate } = createLoop(mockRoots)
const { reconciler, applyProps } = createRenderer(mockRoots)

const render = (
  element: React.ReactNode,
  id: HTMLCanvasElement,
  { size = { width: 0, height: 0 }, mode = 'blocking', ...props }: RenderProps<HTMLCanvasElement> = {},
): MockScene => {
  let root = mockRoots.get(id)
  let fiber = root?.fiber
  let store = root?.store

  if (!fiber) {
    // If no root has been found, make one
    store = createStore(applyProps, invalidate, advance, {
      // @ts-ignore
      gl: new THREE.WebGLRenderer({ context: createWebGLContext(HTMLCanvasElement), precision: 'highp' }),
      size,
      frameloop: 'never',
      ...props,
    })

    fiber = reconciler.createContainer(store, modes.indexOf(mode) as RootTag, false, null)
    // Map it
    mockRoots.set(id, { fiber, store })
  }

  if (store && fiber) {
    reconciler.updateContainer(<Provider store={store} element={element} />, fiber, null, () => undefined)
    return (store!.getState().scene as unknown) as MockScene
  } else {
    throw 'R3F: Error creating fiber-root!'
  }
}

function Provider({ store, element }: { store: MockUseStoreState; element: React.ReactNode }) {
  React.useEffect(() => store.getState().set((state) => ({ internal: { ...state.internal, active: true } })), [])
  return <context.Provider value={store}>{element}</context.Provider>
}

const unmount = (id: HTMLCanvasElement) => {
  const root = mockRoots.get(id)
  const fiber = root?.fiber

  const dispose = (obj: any) => {
    if (obj.dispose && obj.type !== 'Scene') obj.dispose()
    for (const p in obj) {
      delete obj[p]
    }
  }

  if (fiber) {
    reconciler.updateContainer(null, fiber, null, () => {
      const state = root?.store.getState()
      if (state) {
        dispose(state.gl)
        dispose(state.raycaster)
        dispose(state.camera)
        dispose(state)
      }
      mockRoots.delete(id)
    })
  }
}

reconciler.injectIntoDevTools({
  bundleType: process.env.NODE_ENV === 'production' ? 0 : 1,
  rendererPackageName: 'react-three-test-renderer',
  // @ts-expect-error it's a babel macro
  version: typeof R3F_VERSION !== 'undefined' ? R3F_VERSION : '0.0.0',
})

const create = async (element: React.ReactNode, options?: Partial<CreateOptions>): Promise<Renderer> => {
  const canvas = createCanvas({
    width: options?.width,
    height: options?.height,
  })

  const _fiber = canvas

  let scene: MockScene = null!

  await reconciler.act(async () => {
    scene = render(element, _fiber, options as RenderProps<typeof canvas>) as MockScene
  })

  const _store = mockRoots.get(_fiber)!.store

  return {
    scene: wrapFiber(scene),
    unmount: async () => {
      await reconciler.act(async () => {
        unmount(_fiber)
      })
    },
    getInstance: () => {
      // this is our root
      const fiber = mockRoots.get(_fiber)?.fiber
      const root = {
        /**
         * we wrap our child in a Provider component
         * and context.Provider, so do a little
         * artificial dive to get round this and
         * pass context.Provider as if it was the
         * actual react root
         */
        current: fiber.current.child.child,
      }
      if (fiber.current.child.child) {
        /**
         * so this actually returns the instance
         * the user has passed through as a Fiber
         */
        return reconciler.getPublicRootInstance(root)
      } else {
        return null
      }
    },
    update: async (newElement: React.ReactNode) => {
      const fiber = mockRoots.get(_fiber)?.fiber
      if (fiber) {
        await reconciler.act(async () => {
          reconciler.updateContainer(newElement, fiber, null, () => null)
        })
      }
      return
    },
    toTree: () => {
      return toTree(scene)
    },
    toGraph: () => {
      return toGraph(scene)
    },
    fireEvent: createEventFirer(reconciler.act, _store),
    advanceFrames: (frames: number, delta: number | number[] = 1) => {
      const state = _store.getState()
      const storeSubscribers = state.internal.subscribers

      storeSubscribers.forEach((subscriber) => {
        for (let i = 0; i < frames; i++) {
          if (is.arr(delta)) {
            subscriber.ref.current(state, (delta as number[])[i] || (delta as number[])[-1])
          } else {
            subscriber.ref.current(state, delta as number)
          }
        }
      })
    },
  }
}

const act = reconciler.act as Act

export * as ReactThreeTest from './types'
export default { create, act }
