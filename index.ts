export * from './src/three-types'
export * from './src/canvas'
import { useRender, useThree, useUpdate, useResource, useLoader } from './src/hooks'
import {
  addEffect,
  invalidate,
  render,
  unmountComponentAtNode,
  extend,
  applyProps,
  createPortal,
} from './src/reconciler'

const apply = (objects: object): void => {
  console.warn('react-three-fiber: Please use extend ✅ instead of apply ❌, the former will be made obsolete soon!')
  extend(objects)
}

export {
  addEffect,
  invalidate,
  render,
  createPortal,
  unmountComponentAtNode,
  apply,
  extend,
  applyProps,
  useRender,
  useThree,
  useUpdate,
  useResource,
  useLoader,
}
