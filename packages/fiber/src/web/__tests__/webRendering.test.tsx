import * as React from 'react'
import { Group, Mesh, BoxBufferGeometry, MeshBasicMaterial } from 'three'
import { createCanvas } from 'react-three-test-renderer/src/createTestCanvas'

import { WebGLRenderingContext } from '../../__mocks__/webgl'

import { render } from '../index'

type ComponentMesh = Mesh<BoxBufferGeometry, MeshBasicMaterial>

describe('web renderer', () => {
  const canvas = createCanvas({
    beforeReturn: (canvas) => {
      //@ts-ignore
      canvas.getContext = (type: string) => {
        const gl = new WebGLRenderingContext(canvas)

        if (type === 'webgl' || type === 'webgl2') {
          return new WebGLRenderingContext(canvas)
        }
      }
    },
  })

  it('renders a simple component', () => {
    const Mesh = () => {
      return (
        <mesh>
          <boxBufferGeometry args={[2, 2]} />
          <meshBasicMaterial />
        </mesh>
      )
    }
    const scene = render(<Mesh />, canvas)
    expect(scene.children[0].type).toEqual('Mesh')
  })

  it('renders an empty scene', () => {
    const Empty = () => {
      return null
    }
    const scene = render(<Empty />, canvas)

    expect(scene.type).toEqual('Scene')
    expect(scene.children).toEqual([])
  })

  it('can render a composite component', () => {
    class Parent extends React.Component {
      render() {
        return (
          <group>
            <color attach="background" args={[0, 0, 0]} />
            <Child />
          </group>
        )
      }
    }

    const Child = () => {
      return (
        <mesh>
          <boxBufferGeometry args={[2, 2]} />
          <meshBasicMaterial />
        </mesh>
      )
    }

    const scene = render(<Parent />, canvas)

    expect(scene.children[0].type).toEqual('Group')
    // @ts-expect-error we do append background to group, but it's not wrong because it won't do anything.
    expect((scene.children[0] as Group).background.getStyle()).toEqual('rgb(0,0,0)')
    expect(scene.children[0].children[0].type).toEqual('Mesh')
    expect((scene.children[0].children[0] as ComponentMesh).geometry.type).toEqual('BoxGeometry')
    expect((scene.children[0].children[0] as ComponentMesh).material.type).toEqual('MeshBasicMaterial')
  })

  it('renders some basics with an update', () => {
    let renders = 0

    class Component extends React.PureComponent {
      state = {
        pos: 3,
      }

      componentDidMount() {
        this.setState({
          pos: 7,
        })
      }

      render() {
        renders++
        return (
          <group position-x={this.state.pos}>
            <Child />
            <Null />
          </group>
        )
      }
    }

    const Child = () => {
      renders++
      return <color attach="background" args={[0, 0, 0]} />
    }

    const Null = () => {
      renders++
      return null
    }

    const scene = render(<Component />, canvas)

    expect(scene.children[0].position.x).toEqual(7)
    expect(renders).toBe(6)
  })

  // it('can handle useThree hook', () => {
  //   expect(true).toBe(false)
  // })

  // it('can handle useFrame hook', () => {
  //   expect(true).toBe(false)
  // })

  // it('can handle useLoader hook', () => {
  //   expect(true).toBe(false)
  // })

  // it('can handle useResource hook', () => {
  //   expect(true).toBe(false)
  // })

  // it('can handle useUpdate hook', () => {
  //   expect(true).toBe(false)
  // })
})
