import * as THREE from 'three'
import React, { useState, useRef, useContext, useEffect, useCallback, useMemo } from 'react'
import { apply, Canvas, useRender, useThree } from 'react-three-fiber'
import { OrbitControls } from '../resources/controls/OrbitControls'
import { EffectComposer } from './../resources/postprocessing/EffectComposer'
import { ShaderPass } from './../resources/postprocessing/ShaderPass'
import { RenderPass } from './../resources/postprocessing/RenderPass'
import { WaterPass } from './../resources/postprocessing/WaterPass'
import { FXAAShader } from './../resources/shaders/FXAAShader'
import fontFile from './../resources/fonts/unknown'
apply({ OrbitControls, EffectComposer, ShaderPass, RenderPass, WaterPass })

/** This renders text via canvas and projects it as a sprite */
function Text({ children, size = 1, letterSpacing = 0.01, color = '#000000' }) {
  const [font] = useState(() => new THREE.FontLoader().parse(fontFile))
  const [shapes, [x, y]] = useMemo(() => {
    let x = 0,
      y = 0
    let letters = [...children]
    let mat = new THREE.MeshBasicMaterial({ color, opacity: 1, transparent: true })
    return [
      letters.map(letter => {
        const geom = new THREE.ShapeGeometry(font.generateShapes(letter, size, 1))
        geom.computeBoundingBox()
        const mesh = new THREE.Mesh(geom, mat)
        mesh.position.x = x
        x += geom.boundingBox.max.x + letterSpacing
        y = Math.max(y, geom.boundingBox.max.y)
        return mesh
      }),
      [x, y],
    ]
  }, [children])
  return (
    <group position={[-x / 2, -y / 2, 0]}>
      {shapes.map((shape, index) => (
        <primitive key={index} object={shape} />
      ))}
    </group>
  )
}

function Main({ camera }) {
  const scene = useRef()
  const composer = useRef()
  const { gl, size } = useThree()
  useEffect(() => void composer.current.obj.setSize(size.width, size.height), [size])
  useRender(({ gl }) => void ((gl.autoClear = true), composer.current.obj.render()), true)
  //useRender(({ gl }) => void ((gl.autoClear = true), gl.render(scene.current, camera)))

  return (
    <scene ref={scene}>
      <effectComposer ref={composer} args={[gl]}>
        {scene.current && (
          <>
            <renderPass attachArray="passes" scene={scene.current} camera={camera} />
            <waterPass attachArray="passes" factor={1} />
            <shaderPass
              attachArray="passes"
              args={[FXAAShader]}
              material-uniforms-resolution-value={[1 / size.width, 1 / size.height]}
              renderToScreen
            />
          </>
        )}
      </effectComposer>
      <ambientLight />
      <spotLight position={[100, 10, 10]} />
      <Text>lorem</Text>
    </scene>
  )
}

function Hud({ camera }) {
  const scene = useRef()
  useRender(({ gl }) => void ((gl.autoClear = false), gl.clearDepth(), gl.render(scene.current, camera)))
  const [hovered, set] = useState(false)
  const hover = useCallback(() => set(true), [])
  const unhover = useCallback(() => set(false), [])
  return (
    <scene ref={scene}>
      <mesh onHover={hover} onUnhover={unhover}>
        <sphereBufferGeometry attach="geometry" args={[0.5, 64, 64]} />
        <meshBasicMaterial attach="material" color={hovered ? 'hotpink' : 'black'} />
      </mesh>
    </scene>
  )
}

function Content() {
  const camera = useRef()
  const controls = useRef()
  const { size, setDefaultCamera } = useThree()
  useEffect(() => void setDefaultCamera(camera.current), [])
  useRender(() => controls.current.obj.update())
  return (
    <>
      <perspectiveCamera
        ref={camera}
        aspect={size.width / size.height}
        radius={(size.width + size.height) / 4}
        fov={55}
        position={[0, 0, 5]}
        onUpdate={self => self.updateProjectionMatrix()}
      />
      {camera.current && (
        <group>
          <orbitControls ref={controls} args={[camera.current]} enableDamping dampingFactor={0.1} rotateSpeed={0.1} />
          <Main camera={camera.current} />
          <Hud camera={camera.current} />
        </group>
      )}
    </>
  )
}

export default function App() {
  return (
    <Canvas style={{ background: '#dfdfdf' }}>
      <Content />
    </Canvas>
  )
}
