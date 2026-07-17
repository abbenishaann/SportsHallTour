import './style.css'
import * as THREE from 'three'
import { createBenches, createLampPosts } from './models/benches.js'
import { initDayNightToggle } from './interactions/lighting.js'
import { createWelcomeScreen } from './ui/WelcomeScreen.js'
import { createInstructionsPanel } from './ui/intructions.js'

// Scene setup
const scene = new THREE.Scene()

// Camera setup
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(15, 10, 15)
camera.lookAt(0, 0, 0)

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)

document.body.innerHTML = ''
document.body.appendChild(renderer.domElement)

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Clock for animations
const clock = new THREE.Clock()

// Add base lighting for Day mode
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
directionalLight.position.set(10, 20, 10)
scene.add(directionalLight)

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({
    color: 0x808080,
    side: THREE.DoubleSide
  })
)
ground.rotation.x = -Math.PI / 2
scene.add(ground)

// Sports Hall (placeholder)
const hall = new THREE.Mesh(
  new THREE.BoxGeometry(10, 5, 8),
  new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    wireframe: true
  })
)
hall.position.y = 2.5
scene.add(hall)

// --- Integrate Person D Tasks ---

// 1. Create Benches and Lamp Posts
createBenches(scene)
const { lampLights, lampBulbMeshes } = createLampPosts(scene)

// 2. Initialize Lighting Interactions
const updateLighting = initDayNightToggle({ scene, renderer, lampLights, lampBulbMeshes })

// Animation loop state
let isTourStarted = false

function animate() {
  requestAnimationFrame(animate)

  // Only animate transitions if the tour has started
  if (isTourStarted) {
    const delta = clock.getDelta()
    
    // Update lighting transitions (Day/Night)
    if (updateLighting) {
      updateLighting(delta)
    }
    
    // (Other animations like camera controls can go here later)
  }

  renderer.render(scene, camera)
}

// Render the initial static frame behind the overlay
renderer.render(scene, camera)

// 3. Setup UI Overlay
createWelcomeScreen(() => {
  // Callback when "Start Tour" is clicked
  isTourStarted = true
  clock.start() // Reset clock when tour starts
  
  // 4. Show instructions panel
  createInstructionsPanel()
  
  // Start the render loop
  animate()
})