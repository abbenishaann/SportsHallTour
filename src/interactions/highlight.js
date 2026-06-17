import * as THREE from 'three'

// Hover-highlight: raycasts from the screen centre (the crosshair) and makes
// the object under it glow. With PointerLockControls the cursor is locked to
// the centre, so the crosshair *is* the pointer.

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2(0, 0) // screen centre in NDC

let targets = []
let hovered = null

const HIGHLIGHT_EMISSIVE = new THREE.Color(0xffaa33)
const HIGHLIGHT_INTENSITY = 0.4

// Remembers a target's original emissive so we can restore it on leave.
function remember(mesh) {
  if (mesh.userData._emissiveSaved) return
  mesh.userData._origEmissive = mesh.material.emissive
    ? mesh.material.emissive.clone()
    : new THREE.Color(0x000000)
  mesh.userData._origEmissiveIntensity =
    mesh.material.emissiveIntensity ?? 1
  mesh.userData._emissiveSaved = true
}

function applyHighlight(mesh) {
  if (!mesh.material || !mesh.material.emissive) return
  remember(mesh)
  mesh.material.emissive.copy(HIGHLIGHT_EMISSIVE)
  mesh.material.emissiveIntensity = HIGHLIGHT_INTENSITY
}

function clearHighlight(mesh) {
  if (!mesh || !mesh.material || !mesh.material.emissive) return
  if (mesh.userData._emissiveSaved) {
    mesh.material.emissive.copy(mesh.userData._origEmissive)
    mesh.material.emissiveIntensity = mesh.userData._origEmissiveIntensity
  }
}

// camera          : the scene camera
// highlightTargets : array of meshes that should respond to hover
// domElement       : the canvas (used to keep the pointer tracking before lock)
export function setupHighlight(camera, highlightTargets, domElement) {
  targets = highlightTargets

  // Before pointer lock the user still has a free cursor, so track it.
  // Once locked, movementless events keep clientX/Y, so we re-derive NDC each
  // move; the crosshair stays centred which is what we want anyway.
  const onMove = (event) => {
    if (document.pointerLockElement) {
      pointer.set(0, 0)
    } else {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
  }
  ;(domElement || window).addEventListener('mousemove', onMove)

  // Run one raycast pass — called every frame from the animation loop.
  updateHighlight.camera = camera
}

// Performs the hover test. Call once per frame from the animation loop.
export function updateHighlight(camera) {
  const cam = camera || updateHighlight.camera
  if (!cam) return

  raycaster.setFromCamera(pointer, cam)
  const hits = raycaster.intersectObjects(targets, false)
  const first = hits.length ? hits[0].object : null

  if (first !== hovered) {
    if (hovered) clearHighlight(hovered)
    hovered = first
    if (hovered) {
      applyHighlight(hovered)
      document.body.style.cursor = 'pointer'
    } else {
      document.body.style.cursor = 'default'
    }
  }
}

// Lets main.js know what (if anything) is currently under the crosshair.
export function getHoveredObject() {
  return hovered
}
