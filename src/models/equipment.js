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
  // 7. PITCHED PORTAL FRAMES (White concrete arches matching the roof shape)
  //    Spans from side columns (x=-14.5, y=10) to the center peak (x=0, y=14.5).
  // ----------------------------------------------------------
  const frameMat = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 })
  // We place portal frames every 4 units in z from -14 to 2
  const frameZ = [-14, -10, -6, -2, 2]
  const angle = Math.atan2(4.5, 14.5) // rise of 4.5 over run of 14.5

  for (const z of frameZ) {
    // Left sloped beam
    const leftBeam = new THREE.Mesh(
      new THREE.BoxGeometry(15.2, 0.45, 0.45),
      frameMat
    )
    leftBeam.position.set(-7.25, 12.25, z)
    leftBeam.rotation.z = angle // slopes up to the center
    scene.add(leftBeam)
    meshes.push(leftBeam)

    // Right sloped beam
    const rightBeam = new THREE.Mesh(
      new THREE.BoxGeometry(15.2, 0.45, 0.45),
      frameMat
    )
    rightBeam.position.set(7.25, 12.25, z)
    rightBeam.rotation.z = -angle // slopes down from the center
    scene.add(rightBeam)
    meshes.push(rightBeam)
  }

  // ----------------------------------------------------------
  // 8. SLOPED SKYLIGHT PANELS (sitting flat on the ceiling slopes)
  // ----------------------------------------------------------
  const skyMat = new THREE.MeshLambertMaterial({
    color: 0xd8ebd5,
    emissive: 0x9fcf9b,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  })
  const skyGeo = new THREE.PlaneGeometry(3.0, 2.2)
  for (let z = -12; z <= 0; z += 4) {
    // Left sloped skylight
    const panelL = new THREE.Mesh(skyGeo, skyMat)
    panelL.rotation.x = -Math.PI / 2
    panelL.rotation.y = angle
    panelL.position.set(-7.25, 12.2, z)
    scene.add(panelL)
    meshes.push(panelL)

    // Right sloped skylight
    const panelR = new THREE.Mesh(skyGeo, skyMat)
    panelR.rotation.x = -Math.PI / 2
    panelR.rotation.y = -angle
    panelR.position.set(7.25, 12.2, z)
    scene.add(panelR)
    meshes.push(panelR)
  }

  // ----------------------------------------------------------
  // 9. WHITE INTERIOR COLUMNS along both side walls (realigned to x=-14.8, 14.8)
  // ----------------------------------------------------------
  const colMat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 })
  const colGeo = new THREE.BoxGeometry(0.4, 10, 0.5)
  const colZ = [-14, -10, -6, -2, 2]
  for (const x of [-14.8, 14.8]) {
    for (const z of colZ) {
      const col = new THREE.Mesh(colGeo, colMat)
      col.position.set(x, 5, z) // spans y=0..10
      col.castShadow = true
      col.receiveShadow = true
      scene.add(col)
      meshes.push(col)
    }
  }

  // ----------------------------------------------------------
  // 10. BLUE SPECTATOR CHAIRS along both sidelines (rows of 10, realigned)
  // ----------------------------------------------------------
  const chairMat = new THREE.MeshLambertMaterial({ color: 0x1e5fa8 })
  const chairGeo = new THREE.BoxGeometry(0.5, 0.4, 0.5)
  const chairCount = 10
  const chairZStart = -13
  const chairZEnd = 2
  const chairZStep = (chairZEnd - chairZStart) / (chairCount - 1)
  for (const x of [-13.8, 13.8]) {
    for (let i = 0; i < chairCount; i++) {
      const chair = new THREE.Mesh(chairGeo, chairMat)
      chair.position.set(x, 0.2, chairZStart + i * chairZStep)
      chair.castShadow = true
      scene.add(chair)
      meshes.push(chair)
    }
  }

  // ----------------------------------------------------------
  // 11. ROLL-UP METAL SHUTTER DOORS on the side walls (realigned)
  // ----------------------------------------------------------
  const shutterMat = new THREE.MeshLambertMaterial({ color: 0x888a8f, roughness: 0.6 })
  const shutterGeo = new THREE.BoxGeometry(2.8, 3.2, 0.1)
  const shutterPlacements = [
    { x: -14.9, z: -8, rotY: Math.PI / 2 },
    { x: -14.9, z: -4, rotY: Math.PI / 2 },
    { x: 14.9, z: -8, rotY: Math.PI / 2 },
    { x: 14.9, z: -4, rotY: Math.PI / 2 }
  ]
  for (const s of shutterPlacements) {
    const shutter = new THREE.Mesh(shutterGeo, shutterMat)
    shutter.position.set(s.x, 1.6, s.z)
    shutter.rotation.y = s.rotY
    scene.add(shutter)
    meshes.push(shutter)
  }

  return meshes
}
