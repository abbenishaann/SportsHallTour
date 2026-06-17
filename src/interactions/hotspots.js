import * as THREE from 'three'

// Clickable "hotspot" markers: glowing pulsing sprites placed in the world.
// Clicking one (detected by the raycaster in main.js) opens the info popup
// with that hotspot's text.

const sprites = []
let pulseTime = 0

// Content shown in #info-popup for each hotspot.
const HOTSPOTS = [
  {
    title: 'UTM Sports Hall 2',
    body:
      'The main multi-purpose sports hall at Universiti Teknologi Malaysia. ' +
      'It hosts indoor sports, examinations and large university events under ' +
      'a single 30-metre clear-span roof.',
    position: new THREE.Vector3(0, 3.5, 1.6) // just in front of the entrance
  },
  {
    title: 'Basketball Court',
    body:
      'A full-size indoor basketball court with regulation markings and two ' +
      'hoops. The sprung floor doubles as a venue for badminton, futsal and ' +
      'volleyball.',
    position: new THREE.Vector3(0, 3, -10) // above centre court
  }
]

// Draws a soft glowing circle to a canvas and returns it as a texture.
function makeGlowTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    2,
    size / 2,
    size / 2,
    size / 2
  )
  gradient.addColorStop(0, 'rgba(255, 240, 180, 1)')
  gradient.addColorStop(0.3, 'rgba(255, 200, 90, 0.9)')
  gradient.addColorStop(0.7, 'rgba(255, 160, 40, 0.35)')
  gradient.addColorStop(1, 'rgba(255, 160, 40, 0)')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// Creates the hotspot sprites and adds them to the scene.
// Returns the array of sprite objects (for raycasting in main.js).
export function setupHotspots(scene, camera) {
  const texture = makeGlowTexture()

  for (const data of HOTSPOTS) {
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    })
    const sprite = new THREE.Sprite(material)
    sprite.position.copy(data.position)
    sprite.scale.set(1.2, 1.2, 1.2)
    sprite.userData = {
      isHotspot: true,
      baseScale: 1.2,
      title: data.title,
      body: data.body
    }
    scene.add(sprite)
    sprites.push(sprite)
  }

  // Wire up the popup's close button once.
  const closeBtn = document.getElementById('info-popup-close')
  if (closeBtn) {
    closeBtn.addEventListener('click', hideHotspotPopup)
  }

  return sprites
}

// Pulsing scale animation. Call once per frame with the frame delta.
export function updateHotspots(delta) {
  pulseTime += delta
  const pulse = 1 + Math.sin(pulseTime * 3) * 0.15
  for (const sprite of sprites) {
    const s = sprite.userData.baseScale * pulse
    sprite.scale.set(s, s, s)
  }
}

// Returns the sprite array so main.js can raycast against them.
export function getHotspots() {
  return sprites
}

// Fills and shows #info-popup for the given hotspot sprite.
export function showHotspotPopup(sprite) {
  if (!sprite || !sprite.userData || !sprite.userData.isHotspot) return
  const popup = document.getElementById('info-popup')
  const title = document.getElementById('info-popup-title')
  const body = document.getElementById('info-popup-body')
  if (!popup) return

  if (title) title.textContent = sprite.userData.title
  if (body) body.textContent = sprite.userData.body
  popup.classList.remove('hidden')

  // Release the pointer so the user can click the close button.
  if (document.pointerLockElement) document.exitPointerLock()
}

export function hideHotspotPopup() {
  const popup = document.getElementById('info-popup')
  if (popup) popup.classList.add('hidden')
}
