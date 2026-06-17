import * as THREE from 'three'

// Builds the car park in front of Sports Hall 2: dark asphalt surface, central
// driveway, curbed grass islands separating the driveway from the parking lots,
// white parking-bay lines (including a blue disabled space), and road lines.
//
// Returns: array of all mesh/line objects.
export function buildParking(scene) {
  const objects = []

  // ----------------------------------------------------------
  // 1. DARK ASPHALT GROUND PLANE
  // ----------------------------------------------------------
  const asphalt = new THREE.Mesh(
    new THREE.PlaneGeometry(62, 45),
    new THREE.MeshLambertMaterial({ color: 0x1c1d20, roughness: 0.9 })
  )
  asphalt.rotation.x = -Math.PI / 2
  asphalt.position.set(0, 0.005, 22)
  asphalt.receiveShadow = true
  scene.add(asphalt)
  objects.push(asphalt)

  // ----------------------------------------------------------
  // 2. OUTER GREEN GRASS STRIPS
  // ----------------------------------------------------------
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x3d6e35, roughness: 1.0 })
  const grassStrips = [
    { w: 10, d: 45, x: -36, z: 22 }, // left
    { w: 10, d: 45, x: 36, z: 22 }, // right
    { w: 82, d: 10, x: 0, z: 47 } // front border
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
  // 3. CENTRAL GRASS ISLANDS WITH CONCRETE CURBS
  //    These divide the central driveway from the parking lots.
  // ----------------------------------------------------------
  const curbMat = new THREE.MeshLambertMaterial({ color: 0x90949c, roughness: 0.8 })
  const islandXPositions = [-7.5, 7.5] // left and right of the driveway

  for (const x of islandXPositions) {
    // Concrete Curb (slightly raised box)
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.12, 32),
      curbMat
    )
    curb.position.set(x, 0.06, 22)
    curb.castShadow = true
    curb.receiveShadow = true
    scene.add(curb)
    objects.push(curb)

    // Grass inside the curb (slightly smaller and sitting just on top of curb)
    const islandGrass = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 31.7),
      grassMat
    )
    islandGrass.rotation.x = -Math.PI / 2
    islandGrass.position.set(x, 0.125, 22)
    islandGrass.receiveShadow = true
    scene.add(islandGrass)
    objects.push(islandGrass)
  }

  // ----------------------------------------------------------
  // 4. PARKING BAY WHITE LINES
  // ----------------------------------------------------------
  const lineMat = new THREE.LineBasicMaterial({ color: 0xeeeeee })
  const y = 0.02
  const bayPoints = []

  // Left and right parking bay bounds
  // Driveway is x = -6.3 to 6.3.
  // Left parking: x = -26 to -8.7. Right parking: x = 8.7 to 26.
  const zStart = 7.0
  const zEnd = 37.0
  const step = 2.5 // width of each bay

  // Left Bays (perpendicular to road, running x: -25 to -8.7)
  for (let z = zStart; z <= zEnd; z += step) {
    bayPoints.push(new THREE.Vector3(-25, y, z))
    bayPoints.push(new THREE.Vector3(-8.7, y, z))
  }
  // Boundary line for left bays
  bayPoints.push(new THREE.Vector3(-8.7, y, zStart))
  bayPoints.push(new THREE.Vector3(-8.7, y, zEnd))
  bayPoints.push(new THREE.Vector3(-25, y, zStart))
  bayPoints.push(new THREE.Vector3(-25, y, zEnd))

  // Right Bays (perpendicular to road, running x: 8.7 to 25)
  for (let z = zStart; z <= zEnd; z += step) {
    bayPoints.push(new THREE.Vector3(8.7, y, z))
    bayPoints.push(new THREE.Vector3(25, y, z))
  }
  // Boundary line for right bays
  bayPoints.push(new THREE.Vector3(8.7, y, zStart))
  bayPoints.push(new THREE.Vector3(8.7, y, zEnd))
  bayPoints.push(new THREE.Vector3(25, y, zStart))
  bayPoints.push(new THREE.Vector3(25, y, zEnd))

  const bayLines = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(bayPoints),
    lineMat
  )
  bayLines.name = 'ParkingBayLines'
  scene.add(bayLines)
  objects.push(bayLines)

  // ----------------------------------------------------------
  // 5. BLUE DISABLED PARKING BAY (Left side closest to entrance steps)
  // ----------------------------------------------------------
  const disabledBlueMat = new THREE.MeshLambertMaterial({
    color: 0x1e5aab,
    transparent: true,
    opacity: 0.75
  })
  const disabledBay = new THREE.Mesh(
    new THREE.PlaneGeometry(16.1, 2.4), // spans x: -24.9 .. -8.8, depth 2.4 (between z=7 and z=9.5)
    disabledBlueMat
  )
  disabledBay.rotation.x = -Math.PI / 2
  disabledBay.position.set(-16.85, 0.01, 8.25)
  disabledBay.receiveShadow = true
  scene.add(disabledBay)
  objects.push(disabledBay)

  // ----------------------------------------------------------
  // 6. ROAD MARKINGS (Dashed centerline down the driveway)
  // ----------------------------------------------------------
  const roadMarkPoints = []
  let roadZ = 6
  // Lane dashes every 4 units along x = 0
  for (let i = 0; i < 9; i++) {
    roadMarkPoints.push(new THREE.Vector3(0, y, roadZ))
    roadMarkPoints.push(new THREE.Vector3(0, y, roadZ + 2))
    roadZ += 4
  }

  const dashes = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(roadMarkPoints),
    lineMat
  )
  dashes.name = 'CentreRoadDashes'
  scene.add(dashes)
  objects.push(dashes)

  return objects
}
