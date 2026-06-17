import * as THREE from 'three'

// Builds the INDOOR sports court of Sports Hall 2 (everything inside the
// building). The court is centred at x=0, z=-5.
//
// Includes: sage-green floor, red border, white + yellow markings, netball
// posts, a herringbone timber feature wall, ceiling trusses + skylights,
// white side columns, blue spectator chairs, and roll-up shutter doors.
//
// Returns: array of visible meshes (used as hover-highlight targets).
export function buildEquipment(scene) {
  const meshes = []
  const COURT_Z = -5

  // ----------------------------------------------------------
  // 1. SAGE GREEN COURT FLOOR
  // ----------------------------------------------------------
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 16),
    new THREE.MeshLambertMaterial({ color: 0x7daa62, side: THREE.DoubleSide })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, 0.02, COURT_Z)
  floor.receiveShadow = true
  floor.name = 'CourtFloor'
  scene.add(floor)
  meshes.push(floor)

  // Court extent: x -13..13, z (COURT_Z-8)..(COURT_Z+8) = -13..3
  const hw = 13 // half width (x)
  const zNear = COURT_Z + 8 // 3
  const zFar = COURT_Z - 8 // -13

  // ----------------------------------------------------------
  // 2. RED BORDER STRIP around the court edge (4 thin boxes)
  // ----------------------------------------------------------
  const redMat = new THREE.MeshLambertMaterial({ color: 0x8b1a1a })
  const borderY = 0.03
  const redStrips = [
    // along x (front & back)
    { w: 26, d: 0.5, x: 0, z: zNear },
    { w: 26, d: 0.5, x: 0, z: zFar },
    // along z (left & right)
    { w: 0.5, d: 16, x: -hw, z: COURT_Z },
    { w: 0.5, d: 16, x: hw, z: COURT_Z }
  ]
  for (const s of redStrips) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(s.w, 0.05, s.d),
      redMat
    )
    strip.position.set(s.x, borderY, s.z)
    scene.add(strip)
    meshes.push(strip)
  }

  // ----------------------------------------------------------
  // 3. WHITE BOUNDARY LINES (court border rectangle)
  // ----------------------------------------------------------
  const lineY = 0.04
  const whiteMat = new THREE.LineBasicMaterial({ color: 0xffffff })
  const boundaryPts = [
    new THREE.Vector3(-hw, lineY, zFar),
    new THREE.Vector3(hw, lineY, zFar),

    new THREE.Vector3(hw, lineY, zFar),
    new THREE.Vector3(hw, lineY, zNear),

    new THREE.Vector3(hw, lineY, zNear),
    new THREE.Vector3(-hw, lineY, zNear),

    new THREE.Vector3(-hw, lineY, zNear),
    new THREE.Vector3(-hw, lineY, zFar)
  ]
  const boundary = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(boundaryPts),
    whiteMat
  )
  scene.add(boundary)

  // ----------------------------------------------------------
  // 4. YELLOW THIRD-LINE DIVISIONS (two lines across the court)
  // ----------------------------------------------------------
  const yellowMat = new THREE.LineBasicMaterial({ color: 0xffd700 })
  const thirdPts = []
  for (const z of [COURT_Z - 5, COURT_Z + 5]) {
    thirdPts.push(new THREE.Vector3(-hw, lineY, z))
    thirdPts.push(new THREE.Vector3(hw, lineY, z))
  }
  const thirds = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(thirdPts),
    yellowMat
  )
  scene.add(thirds)

  // ----------------------------------------------------------
  // 5. NETBALL POST at each end (post + ring, no backboard)
  // ----------------------------------------------------------
  const postMat = new THREE.MeshLambertMaterial({ color: 0xffffff })
  const postGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.05, 12)
  const ringGeo = new THREE.TorusGeometry(0.19, 0.02, 8, 16)
  for (const pz of [-13, 3]) {
    const post = new THREE.Mesh(postGeo, postMat)
    post.position.set(0, 1.5, pz) // centre so it spans 0 .. 3.05
    post.castShadow = true
    scene.add(post)
    meshes.push(post)

    const ring = new THREE.Mesh(ringGeo, postMat)
    ring.rotation.x = Math.PI / 2 // lay the ring flat (horizontal)
    ring.position.set(0, 3.0, pz)
    scene.add(ring)
    meshes.push(ring)
  }

  // ----------------------------------------------------------
  // 6. HERRINGBONE TIMBER FEATURE WALL (back wall z=-14)
  //    30 panels, 2 rows, alternating +/-30 deg around Y.
  // ----------------------------------------------------------
  const timberMat = new THREE.MeshLambertMaterial({ color: 0x7a5030 })
  const panelGeo = new THREE.BoxGeometry(1.2, 1.4, 0.08)
  const cols = 15
  const rows = 2
  const xStart = -6
  const xEnd = 6
  const xStep = (xEnd - xStart) / (cols - 1)
  const rowY = [4.0, 5.6] // upper wall section (covers ~3.3 .. 6.3)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const panel = new THREE.Mesh(panelGeo, timberMat)
      panel.position.set(xStart + c * xStep, rowY[r], -14)
      // alternate the chevron direction to build a herringbone pattern
      panel.rotation.y = (c + r) % 2 === 0 ? 0.52 : -0.52
      scene.add(panel)
      meshes.push(panel)
    }
  }

  // ----------------------------------------------------------
  // 7. CEILING TRUSSES (dark grey steel grid at y=10)
  // ----------------------------------------------------------
  const trussMat = new THREE.MeshLambertMaterial({ color: 0x333333 })
  // Horizontal beams (span x), every 4 units in z from -14 to 4
  const hBeamGeo = new THREE.BoxGeometry(28, 0.25, 0.25)
  for (let z = -14; z <= 4; z += 4) {
    const beam = new THREE.Mesh(hBeamGeo, trussMat)
    beam.position.set(0, 10, z)
    scene.add(beam)
    meshes.push(beam)
  }
  // Vertical beams (span z), every 5 units in x from -13 to 13
  const vBeamGeo = new THREE.BoxGeometry(0.25, 0.25, 18)
  for (let x = -13; x <= 13; x += 5) {
    const beam = new THREE.Mesh(vBeamGeo, trussMat)
    beam.position.set(x, 10, -5)
    scene.add(beam)
    meshes.push(beam)
  }

  // ----------------------------------------------------------
  // 8. SKYLIGHT PANELS between the trusses (translucent, y=9.9)
  // ----------------------------------------------------------
  const skyMat = new THREE.MeshLambertMaterial({
    color: 0xc8e6c9,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide
  })
  const skyGeo = new THREE.PlaneGeometry(3.5, 3.5)
  for (let x = -12; x <= 12; x += 4) {
    for (let z = -13; z <= 3; z += 4) {
      const panel = new THREE.Mesh(skyGeo, skyMat)
      panel.rotation.x = -Math.PI / 2
      panel.position.set(x, 9.9, z)
      scene.add(panel)
      meshes.push(panel)
    }
  }

  // ----------------------------------------------------------
  // 9. WHITE INTERIOR COLUMNS along both side walls
  // ----------------------------------------------------------
  const colMat = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 })
  const colGeo = new THREE.BoxGeometry(0.5, 6, 0.5)
  const colZ = [-11, -7, -3, 1]
  for (const x of [-12, 12]) {
    for (const z of colZ) {
      const col = new THREE.Mesh(colGeo, colMat)
      col.position.set(x, 3, z) // centre at y=3 (spans 0..6)
      col.castShadow = true
      scene.add(col)
      meshes.push(col)
    }
  }

  // ----------------------------------------------------------
  // 10. BLUE SPECTATOR CHAIRS along both sidelines (rows of 8)
  // ----------------------------------------------------------
  const chairMat = new THREE.MeshLambertMaterial({ color: 0x1e5fa8 })
  const chairGeo = new THREE.BoxGeometry(0.5, 0.4, 0.5)
  const chairCount = 8
  const chairZStart = -11
  const chairZEnd = 1
  const chairZStep = (chairZEnd - chairZStart) / (chairCount - 1)
  for (const x of [-11, 11]) {
    for (let i = 0; i < chairCount; i++) {
      const chair = new THREE.Mesh(chairGeo, chairMat)
      chair.position.set(x, 0.2, chairZStart + i * chairZStep)
      chair.castShadow = true
      scene.add(chair)
      meshes.push(chair)
    }
  }

  // ----------------------------------------------------------
  // 11. ROLL-UP METAL SHUTTER DOORS on the side walls
  // ----------------------------------------------------------
  const shutterMat = new THREE.MeshLambertMaterial({ color: 0x777777 })
  const shutterGeo = new THREE.BoxGeometry(2.8, 2.8, 0.1)
  const shutterPlacements = [
    { x: -12.5, z: -10, rotY: Math.PI / 2 },
    { x: -12.5, z: -2, rotY: Math.PI / 2 },
    { x: 12.5, z: -10, rotY: Math.PI / 2 },
    { x: 12.5, z: -2, rotY: Math.PI / 2 }
  ]
  for (const s of shutterPlacements) {
    const shutter = new THREE.Mesh(shutterGeo, shutterMat)
    shutter.position.set(s.x, 1.5, s.z)
    shutter.rotation.y = s.rotY // face into the court along the side walls
    scene.add(shutter)
    meshes.push(shutter)
  }

  return meshes
}
