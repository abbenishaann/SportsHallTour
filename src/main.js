import './style.css'
import * as THREE from 'three'

// Scene
const scene = new THREE.Scene()

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

// Renderer
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)

document.body.innerHTML = ''
document.body.appendChild(renderer.domElement)

//Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshBasicMaterial({
    color: 0x808080,
    side: THREE.DoubleSide
  })
)

ground.rotation.x = Math.PI / 2

scene.add(ground)

// Sports Hall

const hall = new THREE.Mesh(
  new THREE.BoxGeometry(10, 5, 8),
  new THREE.MeshBasicMaterial({
    color: 0xcccccc,
    wireframe: true
  })
)

hall.position.y = 2.5

scene.add(hall)

camera.position.set(15, 10, 15)

camera.lookAt(0, 0, 0)

function animate() {
  requestAnimationFrame(animate)



  renderer.render(scene, camera)
}

animate()