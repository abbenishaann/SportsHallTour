import './style.css'
import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'

import { buildBuilding } from './models/building.js'
import { buildParking } from './models/parking.js'
import { buildTrees } from './models/trees.js'
import { buildBenches } from './models/benches.js'
import { buildEquipment } from './models/equipment.js'

import { setupLighting, toggleDayNight } from './interactions/lighting.js'
import {
  setupHighlight,
  updateHighlight,
  getHoveredObject
} from './interactions/highlight.js'
import {
  setupHotspots,
  updateHotspots,
  getHotspots,
  showHotspotPopup
} from './interactions/hotspots.js'

import { setupWelcomeScreen } from './ui/WelcomeScreen.js'
import { setupInstructions } from './ui/intructions.js'

/* ============================================================
   Scene / Camera / Renderer
   ============================================================ */
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87ceeb)

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 1.7, 20) // eye height, in front of the building

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const canvas = renderer.domElement
canvas.id = 'three-canvas'
document.body.appendChild(canvas)

/* ============================================================
   Ground
   ============================================================ */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 1 })
)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

// Paved apron / car-park surface in front of the building.
const apron = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 40),
  new THREE.MeshStandardMaterial({ color: 0x555a60, roughness: 1 })
)
apron.rotation.x = -Math.PI / 2
apron.position.set(0, 0.01, 12)
apron.receiveShadow = true
scene.add(apron)

/* ============================================================
   Build the world
   ============================================================ */
const { building, lampLights } = buildBuilding(scene)
buildParking(scene)
const treeCanopies = buildTrees(scene)
const benches = buildBenches(scene)
const equipment = buildEquipment(scene)

setupLighting(scene, lampLights)

// Everything that should glow on hover.
const highlightTargets = [
  building,
  ...treeCanopies,
  ...benches,
  ...equipment
]
setupHighlight(camera, highlightTargets, canvas)

setupHotspots(scene, camera)

/* ============================================================
   First-person controls (PointerLockControls + WASD)
   ============================================================ */
const controls = new PointerLockControls(camera, canvas)

const move = { forward: false, backward: false, left: false, right: false }
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()
const SPEED = 60
const PLAYER_HEIGHT = 1.7

let tourStarted = false

function onKeyDown(e) {
  switch (e.code) {
    case 'KeyW':
    case 'ArrowUp':
      move.forward = true
      break
    case 'KeyS':
    case 'ArrowDown':
      move.backward = true
      break
    case 'KeyA':
    case 'ArrowLeft':
      move.left = true
      break
    case 'KeyD':
    case 'ArrowRight':
      move.right = true
      break
  }
}
function onKeyUp(e) {
  switch (e.code) {
    case 'KeyW':
    case 'ArrowUp':
      move.forward = false
      break
    case 'KeyS':
    case 'ArrowDown':
      move.backward = false
      break
    case 'KeyA':
    case 'ArrowLeft':
      move.left = false
      break
    case 'KeyD':
    case 'ArrowRight':
      move.right = false
      break
  }
}
document.addEventListener('keydown', onKeyDown)
document.addEventListener('keyup', onKeyUp)

const crosshair = document.getElementById('crosshair')
controls.addEventListener('lock', () => {
  if (crosshair) crosshair.classList.remove('hidden')
})
controls.addEventListener('unlock', () => {
  if (crosshair) crosshair.classList.add('hidden')
})

/* ============================================================
   Raycaster — hotspot click detection
   ============================================================ */
const clickRaycaster = new THREE.Raycaster()
const screenCentre = new THREE.Vector2(0, 0)

function handleClick() {
  if (!tourStarted) return

  // If the pointer isn't locked (e.g. after closing a popup), clicking the
  // canvas re-enters first-person mode instead of acting as a hotspot click.
  if (!controls.isLocked) {
    controls.lock()
    return
  }

  // Locked: raycast from the crosshair against the hotspot sprites.
  clickRaycaster.setFromCamera(screenCentre, camera)
  const hits = clickRaycaster.intersectObjects(getHotspots(), false)
  if (hits.length) {
    showHotspotPopup(hits[0].object)
  }
}
canvas.addEventListener('click', handleClick)

/* ============================================================
   Day / Night toggle
   ============================================================ */
let isNight = false
const dayNightBtn = document.getElementById('day-night-toggle')
if (dayNightBtn) {
  dayNightBtn.addEventListener('click', () => {
    isNight = !isNight
    toggleDayNight(isNight, scene)
    dayNightBtn.textContent = isNight ? '☀️ Day' : '🌙 Night'
  })
}

/* ============================================================
   UI flow: welcome -> instructions -> explore
   ============================================================ */
setupWelcomeScreen()
setupInstructions(() => {
  tourStarted = true
  // The instructions module already requested pointer lock on the canvas;
  // ensure PointerLockControls is aware and the crosshair shows.
  if (!controls.isLocked) controls.lock()
})

/* ============================================================
   Animation loop
   ============================================================ */
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const delta = Math.min(clock.getDelta(), 0.1)

  // Movement (only while pointer is locked).
  if (controls.isLocked) {
    velocity.x -= velocity.x * 10 * delta
    velocity.z -= velocity.z * 10 * delta

    direction.z = Number(move.forward) - Number(move.backward)
    direction.x = Number(move.right) - Number(move.left)
    direction.normalize()

    if (move.forward || move.backward) velocity.z -= direction.z * SPEED * delta
    if (move.left || move.right) velocity.x -= direction.x * SPEED * delta

    controls.moveRight(-velocity.x * delta)
    controls.moveForward(-velocity.z * delta)

    camera.position.y = PLAYER_HEIGHT // stay grounded
  }

  updateHighlight(camera)
  updateHotspots(delta)

  renderer.render(scene, camera)
}
animate()

/* ============================================================
   Resize handling
   ============================================================ */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
