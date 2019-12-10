import { WebGLRenderer, Renderer as ThreeRenderer } from 'three'
import React, { useRef, useState, useMemo, useEffect } from 'react'
import useMeasure, { RectReadOnly } from 'react-use-measure'
import { ResizeObserver } from '@juggle/resize-observer'
import mergeRefs from 'react-merge-refs'
import { useCanvas, CanvasProps, PointerEvents } from '../../../canvas'

const defaultStyles: React.CSSProperties = { position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }

interface Renderer extends Omit<ThreeRenderer, 'domElement'> {}

export interface ResizeContainerProps extends CanvasProps {
  children: React.ReactNode
  renderer: () => Renderer | undefined | null
  effects?: (renderer: any, parent: HTMLDivElement) => () => any
  preRender?: React.ReactNode
  className?: string
  style: React.CSSProperties
}

interface ResizeContainerState {
  size: RectReadOnly
  setEvents: React.Dispatch<React.SetStateAction<PointerEvents>>
  container: HTMLDivElement
}

interface ContentProps extends ResizeContainerProps, ResizeContainerState {}

function Content({ children, setEvents, container, renderer, effects, ...props }: ContentProps) {
  // Create renderer
  const [gl] = useState(renderer)
  if (!gl) console.warn('No renderer created!')

  // Mount and unmount managemenbt
  useEffect(() => effects && effects(gl, container), [])

  // Init canvas, fetch events, hand them back to the wrapping div
  const events = useCanvas({ ...props, children, gl: (gl as unknown) as WebGLRenderer })
  useEffect(() => void setEvents(events), [events])
  return null
}

const ResizeContainer = React.memo((props: ResizeContainerProps) => {
  const {
    renderer,
    effects,
    children,
    vr,
    gl2,
    concurrent,
    shadowMap,
    orthographic,
    invalidateFrameloop,
    updateDefaultCamera,
    noEvents,
    gl,
    camera,
    raycaster,
    pixelRatio,
    onCreated,
    onPointerMissed,
    preRender,
    resize,
    style,
    ...restSpread
  } = props

  const containerRef = useRef<HTMLDivElement>()
  const [events, setEvents] = useState<PointerEvents>({} as PointerEvents)
  const [bind, size] = useMeasure(
    resize || {
      scroll: true,
      debounce: { scroll: 50, resize: 0 },
      polyfill: typeof window === 'undefined' || !(window as any).ResizeObserver ? ResizeObserver : undefined,
    }
  )

  // Flag view ready once it's been measured out
  const readyFlag = useRef(false)
  const ready = useMemo(() => (readyFlag.current = readyFlag.current || (!!size.width && !!size.height)), [size])
  const state = useMemo(() => ({ size, setEvents, container: containerRef.current as HTMLDivElement }), [size])

  // Allow Gatsby, Next and other server side apps to run. Will output styles to reduce flickering.
  if (typeof window === 'undefined') return <div style={{ ...defaultStyles, ...style }} {...restSpread} />

  // Render the canvas into the dom
  return (
    <div ref={mergeRefs([bind, containerRef])} style={{ ...defaultStyles, ...style }} {...events} {...restSpread}>
      {preRender}
      {ready && <Content {...props} {...state} />}
    </div>
  )
})

export { ResizeContainer }
