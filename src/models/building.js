import * as THREE from 'three'

// Builds UTM Sports Hall 2 based on the real reference photos:
// white hall body, a dramatic sharp triangular gable roof, an orange annexe
// wing, the entrance portico with maroon signage fascia and red tiled
// cylindrical columns, steps, and 4 globe lamp posts.
//
// Returns: { building, lampLights }
//   building   -> main hall mesh (raycastable for highlight/click)
//   lampLights -> array of 4 PointLights embedded in the lamp globes
//                 (added to the scene by lighting.js; off by default)
export function buildBuilding(scene) {
  const lampLights = []

  // ----------------------------------------------------------
  // 1. MAIN HALL BODY
  // ----------------------------------------------------------
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(30, 8, 18),
    new THREE.MeshLambertMaterial({ color: 0xe0e0e0 })
  )
  building.position.set(0, 4, 0)
  building.castShadow = true
  building.receiveShadow = true
  building.name = 'SportsHall2'
  scene.add(building)

  // ----------------------------------------------------------
  // 2. PEAKED TRIANGULAR GABLE ROOF (very dark charcoal)
  //    Triangle cross-section: base width 34, sharp peak height 10,
  //    extruded along the depth axis.
  // ----------------------------------------------------------
  const roofShape = new THREE.Shape()
  roofShape.moveTo(-17, 0) // base width 34 (wider than the 30-wide body)
  roofShape.lineTo(17, 0)
  roofShape.lineTo(0, 10) // tall sharp peak
  roofShape.lineTo(-17, 0)

  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth: 20,
    bevelEnabled: false
  })
  const roof = new THREE.Mesh(
    roofGeo,
    new THREE.MeshLambertMaterial({ color: 0x2d2d2d })
  )
  // Base of the triangle sits exactly on top of the body (y = 8); the extrude
  // runs along +Z, so shift back by 10 to centre it (z: -10 .. 10).
  roof.position.set(0, 8, -10)
  roof.castShadow = true
  scene.add(roof)

  // ----------------------------------------------------------
  // 3. FRONT GABLE FACE (white triangle facing the parking area)
  // ----------------------------------------------------------
  const gableGeo = new THREE.ShapeGeometry(roofShape)
  const gableFace = new THREE.Mesh(
    gableGeo,
    new THREE.MeshLambertMaterial({ color: 0xeeeeee, side: THREE.DoubleSide })
  )
  gableFace.position.set(0, 8, 10.05) // just in front of the roof's front face
  scene.add(gableFace)

  // ----------------------------------------------------------
  // 4. ORANGE ANNEXE WING (right side)
  // ----------------------------------------------------------
  const annexe = new THREE.Mesh(
    new THREE.BoxGeometry(12, 6, 10),
    new THREE.MeshLambertMaterial({ color: 0xd4601a })
  )
  annexe.position.set(21, 3, 0)
  annexe.castShadow = true
  annexe.receiveShadow = true
  annexe.name = 'AnnexeWing'
  scene.add(annexe)

  // ----------------------------------------------------------
  // 5. ENTRANCE PORTICO OVERHANG
  // ----------------------------------------------------------
  const portico = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.4, 5),
    new THREE.MeshLambertMaterial({ color: 0x444444 })
  )
  portico.position.set(0, 5, 11.5)
  portico.castShadow = true
  scene.add(portico)

  // ----------------------------------------------------------
  // 6. MAROON SIGNAGE FASCIA ("Sports HALL 2")
  // ----------------------------------------------------------
  const fascia = new THREE.Mesh(
    new THREE.BoxGeometry(14, 2, 0.3),
    new THREE.MeshLambertMaterial({ color: 0x8b1a1a })
  )
  fascia.position.set(0, 5.5, 9.3)
  fascia.name = 'SignageFascia'
  scene.add(fascia)

  // ----------------------------------------------------------
  // 7. TWO RED CYLINDRICAL COLUMNS (red ceramic tile cladding)
  // ----------------------------------------------------------
  const columnGeo = new THREE.CylinderGeometry(0.4, 0.4, 5, 16)
  const columnMat = new THREE.MeshLambertMaterial({ color: 0xa03530 })
  for (const x of [-5, 5]) {
    const column = new THREE.Mesh(columnGeo, columnMat)
    column.position.set(x, 2.5, 10)
    column.castShadow = true
    scene.add(column)
  }

  // ----------------------------------------------------------
  // 8. ENTRANCE STEPS (3 shallow steps)
  // ----------------------------------------------------------
  const stepMat = new THREE.MeshLambertMaterial({ color: 0xddd5c0 })
  const steps = [
    { w: 14, z: 13.5, y: 0.15 },
    { w: 13, z: 12.8, y: 0.45 },
    { w: 12, z: 12.1, y: 0.75 }
  ]
  for (const s of steps) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(s.w, 0.3, 1),
      stepMat
    )
    step.position.set(0, s.y, s.z)
    step.receiveShadow = true
    scene.add(step)
  }

  // ----------------------------------------------------------
  // 9. ENTRANCE FLOOR (cream tiled portico)
  // ----------------------------------------------------------
  const porticoFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 5),
    new THREE.MeshLambertMaterial({ color: 0xddd5c0, side: THREE.DoubleSide })
  )
  porticoFloor.rotation.x = -Math.PI / 2
  porticoFloor.position.set(0, 0.02, 11)
  porticoFloor.receiveShadow = true
  scene.add(porticoFloor)

  // ----------------------------------------------------------
  // 10. FOUR GLOBE LAMP POSTS
  // ----------------------------------------------------------
  const shaftGeo = new THREE.CylinderGeometry(0.08, 0.08, 6, 12)
  const shaftMat = new THREE.MeshLambertMaterial({ color: 0x888888 })
  const globeGeo = new THREE.SphereGeometry(0.35, 16, 16)
  const globeMat = new THREE.MeshLambertMaterial({
    color: 0xf5f0d0,
    emissive: 0x000000
  })

  const lampPositions = [
    [-18, 8],
    [18, 8],
    [-18, 20],
    [18, 20]
  ]
  for (const [x, z] of lampPositions) {
    const shaft = new THREE.Mesh(shaftGeo, shaftMat)
    shaft.position.set(x, 3, z) // shaft centre (spans y 0..6)
    shaft.castShadow = true
    scene.add(shaft)

    const globe = new THREE.Mesh(globeGeo, globeMat)
    globe.position.set(x, 6, z) // round orb on top of the shaft
    globe.name = 'LampGlobe'
    scene.add(globe)

    // PointLight embedded inside the globe — off by default; lighting.js
    // turns it on at night.
    const light = new THREE.PointLight(0xffe8a0, 0, 18)
    light.position.set(x, 6, z)
    lampLights.push(light)
  }

  return { building, lampLights }
}
