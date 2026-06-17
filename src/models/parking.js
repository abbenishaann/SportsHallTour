import * as THREE from 'three'

// Builds the car park in front of Sports Hall 2: dark asphalt surface, green
// grass strips around it, white parking-bay lines, and dashed centre-road
// markings.
//
// Returns: array of all mesh/line objects.
export function buildParking(scene) {
  const objects = []

  // ----------------------------------------------------------
  // 1. DARK ASPHALT GROUND PLANE
  // ----------------------------------------------------------
  const asphalt = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 45),
    new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
  )
  asphalt.rotation.x = -Math.PI / 2
  asphalt.position.set(0, 0.005, 22)
  asphalt.receiveShadow = true
  scene.add(asphalt)
  objects.push(asphalt)

  // ----------------------------------------------------------
  // 2. GREEN GRASS STRIPS
  // ----------------------------------------------------------
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x3a6b2e })
  const grassStrips = [
    { w: 8, d: 45, x: -34, z: 22 }, // left
    { w: 8, d: 45, x: 34, z: 22 }, // right
    { w: 60, d: 10, x: 0, z: 47 } // front
  ]
  for (const g of grassStrips) {
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(g.w, g.d), grassMat)
    grass.rotation.x = -Math.PI / 2
    grass.position.set(g.x, 0.004, g.z)
    grass.receiveShadow = true
    scene.add(grass)
    objects.push(grass)
  }

  // ----------------------------------------------------------
  // 3. PARKING BAY WHITE LINES
  // ----------------------------------------------------------
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff })
  const y = 0.02
  const bayPoints = []

  // Vertical bay dividers every 5 units from x=-20 to x=20 (z = 14 .. 38)
  for (let x = -20; x <= 20; x += 5) {
    bayPoints.push(new THREE.Vector3(x, y, 14))
    bayPoints.push(new THREE.Vector3(x, y, 38))
  }
  // Horizontal boundary lines at z=14 and z=38
  for (const z of [14, 38]) {
    bayPoints.push(new THREE.Vector3(-20, y, z))
    bayPoints.push(new THREE.Vector3(20, y, z))
  }
  const bayLines = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(bayPoints),
    lineMat
  )
  bayLines.name = 'ParkingBayLines'
  scene.add(bayLines)
  objects.push(bayLines)

  // ----------------------------------------------------------
  // 4. CENTRE ROAD DASHED LINES (down x=0)
  // ----------------------------------------------------------
  const dashPoints = []
  let dashStart = 38
  for (let i = 0; i < 6; i++) {
    dashPoints.push(new THREE.Vector3(0, y, dashStart))
    dashPoints.push(new THREE.Vector3(0, y, dashStart + 2)) // dash length 2
    dashStart += 4 // length 2 + gap 2
  }
  const dashes = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(dashPoints),
    lineMat
  )
  dashes.name = 'CentreRoadDashes'
  scene.add(dashes)
  objects.push(dashes)

  return objects
}
