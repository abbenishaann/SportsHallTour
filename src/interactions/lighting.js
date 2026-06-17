import * as THREE from 'three'

// Scene lighting + day/night switching.
//
// The lamp-post PointLights are created in building.js and passed in here as
// `lampLights`; this module only adds them to the scene and toggles their
// intensity — it does NOT create its own point lights.

let ambientLight = null
let directionalLight = null
let lamps = []

const DAY_SKY = 0x87ceeb
const NIGHT_SKY = 0x0a0a1f

export function setupLighting(scene, lampLights = []) {
  lamps = lampLights

  ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
  scene.add(ambientLight)

  directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
  directionalLight.position.set(30, 40, 20)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.set(2048, 2048)
  directionalLight.shadow.camera.near = 1
  directionalLight.shadow.camera.far = 160
  directionalLight.shadow.camera.left = -70
  directionalLight.shadow.camera.right = 70
  directionalLight.shadow.camera.top = 70
  directionalLight.shadow.camera.bottom = -70
  scene.add(directionalLight)

  // Add the lamp-post point lights supplied by building.js (off by default).
  for (const light of lamps) {
    light.intensity = 0
    scene.add(light)
  }

  // Start in daytime.
  scene.background = new THREE.Color(DAY_SKY)
}

export function toggleDayNight(isNight, scene) {
  if (ambientLight) ambientLight.intensity = isNight ? 0.05 : 0.7
  if (directionalLight) directionalLight.intensity = isNight ? 0 : 1.2

  for (const light of lamps) {
    light.color.setHex(0xffe8a0)
    light.intensity = isNight ? 2.0 : 0
  }

  scene.background = new THREE.Color(isNight ? NIGHT_SKY : DAY_SKY)
}
