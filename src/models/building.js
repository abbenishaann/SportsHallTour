import * as THREE from 'three'

// Helper to generate a procedural red mosaic tile texture for columns
function makeTileTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  
  // Base tile color
  ctx.fillStyle = '#b63b36'
  ctx.fillRect(0, 0, 64, 64)
  
  // Draw mortar joints / grid lines
  ctx.strokeStyle = '#852420'
  ctx.lineWidth = 1
  for (let i = 0; i <= 64; i += 8) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, 64)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(64, i)
    ctx.stroke()
  }

  // Add subtle color variation to individual tiles for realism
  for (let x = 0; x < 64; x += 8) {
    for (let y = 0; y < 64; y += 8) {
      if (Math.random() > 0.5) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)' // highlight
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)' // shadow
      }
      ctx.fillRect(x + 1, y + 1, 6, 6)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(3, 6)
  return texture
}

// Helper to generate high-resolution sign text
function makeSignTexture(text, bgColor, textColor, isCenter = false) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  
  // Background
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, 512, 128)
  
  // Board borders
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, 508, 124)

  // Text
  ctx.fillStyle = textColor
  ctx.font = isCenter ? 'bold 44px sans-serif' : 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 256, 64)

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

// Helper to create a stylized front decal texture for the JDT vending machine
function makeVendingTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  
  // Blue JDT body
  ctx.fillStyle = '#0f2963'
  ctx.fillRect(0, 0, 256, 512)
  
  // Red side accents
  ctx.fillStyle = '#cf1921'
  ctx.fillRect(0, 0, 30, 512)
  ctx.fillRect(226, 0, 30, 512)

  // Vending logo area
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(40, 30, 176, 80)
  ctx.fillStyle = '#0f2963'
  ctx.font = 'bold 24px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('JDT SPORTS', 128, 75)

  // Drink cans selection area
  ctx.fillStyle = '#111111'
  ctx.fillRect(40, 140, 176, 260)

  // Neon glowing slots
  ctx.fillStyle = '#00ff66'
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      ctx.fillRect(55 + col * 55, 160 + row * 60, 30, 40)
      ctx.fillStyle = '#222222'
      ctx.fillRect(65 + col * 55, 205 + row * 60, 10, 10) // button
      ctx.fillStyle = '#00ff66'
    }
  }

  // Push door / coin return
  ctx.fillStyle = '#333333'
  ctx.fillRect(40, 420, 176, 60)

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

// Helper to create Volleyball Center Banner
function makeBannerTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  
  ctx.fillStyle = '#831015' // Maroon/Red
  ctx.fillRect(0, 0, 512, 128)
  
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 22px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('NVDP VOLLEYBALL DEVELOPMENT CENTER', 256, 45)
  ctx.font = '18px sans-serif'
  ctx.fillText('NEGERI JOHOR', 256, 85)

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

// Builds UTM Sports Hall 2: hollow interior walls, multi-tiered roof, detailed
// entrance lobby (staircase, JDT vending machine, mailboxes, banner), red tiled
// columns, steps, and 4 globe lamp posts placed on the grass medians.
//
// Returns: { building, lampLights, lampGlobes }
//   building   -> building Group (raycastable for highlight/click)
//   lampLights -> array of 4 PointLights embedded in the lamp globes
//   lampGlobes -> array of 4 globe sphere meshes for night emissive toggle
export function buildBuilding(scene) {
  const buildingGroup = new THREE.Group()
  buildingGroup.name = 'SportsHallGroup'
  scene.add(buildingGroup)

  const lampLights = []
  const lampGlobes = []

  // Materials
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xeaeaea, side: THREE.DoubleSide })
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x242426 })
  const stepMat = new THREE.MeshLambertMaterial({ color: 0xe0d6c3 })
  const floorMat = new THREE.MeshLambertMaterial({ color: 0xe3dac9, side: THREE.DoubleSide })
  const railingMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })

  // ----------------------------------------------------------
  // 1. HOLLOW HALL WALLS (contains the sports court, z: -14 to 3.5)
  // ----------------------------------------------------------
  // Back Wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(30, 10, 0.2), wallMat)
  backWall.position.set(0, 5, -14)
  backWall.castShadow = true
  backWall.receiveShadow = true
  buildingGroup.add(backWall)

  // Left Wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 10, 17.5), wallMat)
  leftWall.position.set(-15, 5, -5.25)
  leftWall.castShadow = true
  leftWall.receiveShadow = true
  buildingGroup.add(leftWall)

  // Right Wall (separates main hall from annexe)
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 10, 17.5), wallMat)
  rightWall.position.set(15, 5, -5.25)
  rightWall.castShadow = true
  rightWall.receiveShadow = true
  buildingGroup.add(rightWall)

  // Main Partition Wall (separates court from lobby, at z = 3.5)
  // Consists of a Left section, Right section, and header leaving a center door opening.
  const partLeft = new THREE.Mesh(new THREE.BoxGeometry(12.5, 10, 0.2), wallMat)
  partLeft.position.set(-8.75, 5, 3.5)
  partLeft.castShadow = true
  partLeft.receiveShadow = true
  buildingGroup.add(partLeft)

  const partRight = new THREE.Mesh(new THREE.BoxGeometry(12.5, 10, 0.2), wallMat)
  partRight.position.set(8.75, 5, 3.5)
  partRight.castShadow = true
  partRight.receiveShadow = true
  buildingGroup.add(partRight)

  const partHeader = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 0.2), wallMat)
  partHeader.position.set(0, 8.5, 3.5)
  partHeader.castShadow = true
  partHeader.receiveShadow = true
  buildingGroup.add(partHeader)

  // ----------------------------------------------------------
  // 2. ENTRANCE LOBBY ENCLOSURE (z: 3.5 to 11, width: 14)
  // ----------------------------------------------------------
  // Lobby Left Wall
  const lobbyLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 7, 7.5), wallMat)
  lobbyLeft.position.set(-7, 3.5, 7.25)
  lobbyLeft.castShadow = true
  lobbyLeft.receiveShadow = true
  buildingGroup.add(lobbyLeft)

  // Lobby Right Wall
  const lobbyRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 7, 7.5), wallMat)
  lobbyRight.position.set(7, 3.5, 7.25)
  lobbyRight.castShadow = true
  lobbyRight.receiveShadow = true
  buildingGroup.add(lobbyRight)

  // Lobby Front Wall (with wide entrance opening at z = 11)
  const lobbyFrontL = new THREE.Mesh(new THREE.BoxGeometry(2, 7, 0.2), wallMat)
  lobbyFrontL.position.set(-6, 3.5, 11)
  buildingGroup.add(lobbyFrontL)

  const lobbyFrontR = new THREE.Mesh(new THREE.BoxGeometry(2, 7, 0.2), wallMat)
  lobbyFrontR.position.set(6, 3.5, 11)
  buildingGroup.add(lobbyFrontR)

  const lobbyFrontH = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 0.2), wallMat)
  lobbyFrontH.position.set(0, 6, 11)
  buildingGroup.add(lobbyFrontH)

  // ----------------------------------------------------------
  // 3. MULTI-TIERED ROOF
  // ----------------------------------------------------------
  // Central Gable Roof (triangle running z: -14.5 to 11.5)
  const roofShape = new THREE.Shape()
  roofShape.moveTo(-10, 0)
  roofShape.lineTo(10, 0)
  roofShape.lineTo(0, 8)
  roofShape.lineTo(-10, 0)

  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth: 26,
    bevelEnabled: false
  })
  const centralRoof = new THREE.Mesh(roofGeo, roofMat)
  centralRoof.position.set(0, 10, -14.5)
  centralRoof.castShadow = true
  buildingGroup.add(centralRoof)

  // White Front Gable Face Triangle
  const gableGeo = new THREE.ShapeGeometry(roofShape)
  const gableFace = new THREE.Mesh(
    gableGeo,
    new THREE.MeshLambertMaterial({ color: 0xeeeeee, side: THREE.DoubleSide })
  )
  gableFace.position.set(0, 10, 11.55)
  buildingGroup.add(gableFace)

  // Left Slope Wing Roof
  const leftSlope = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.25, 26), roofMat)
  leftSlope.position.set(-12.8, 11.4, -1.5)
  leftSlope.rotation.z = 0.46 // slopes down to the left eaves
  leftSlope.castShadow = true
  buildingGroup.add(leftSlope)

  // Right Slope Wing Roof
  const rightSlope = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.25, 26), roofMat)
  rightSlope.position.set(12.8, 11.4, -1.5)
  rightSlope.rotation.z = -0.46 // slopes down to the right eaves
  rightSlope.castShadow = true
  buildingGroup.add(rightSlope)

  // ----------------------------------------------------------
  // 4. ORANGE ANNEXE WING (Right Side) & ITS SLOPED ROOF
  // ----------------------------------------------------------
  const annexe = new THREE.Mesh(
    new THREE.BoxGeometry(12, 7, 12),
    new THREE.MeshLambertMaterial({ color: 0xd4601a, roughness: 0.8 })
  )
  annexe.position.set(21, 3.5, -2)
  annexe.castShadow = true
  annexe.receiveShadow = true
  annexe.name = 'AnnexeWing'
  buildingGroup.add(annexe)

  const annexeRoof = new THREE.Mesh(
    new THREE.BoxGeometry(13.2, 0.2, 12.5),
    roofMat
  )
  annexeRoof.position.set(21.2, 7.3, -2)
  annexeRoof.rotation.z = -0.22 // slopes down to the right
  annexeRoof.castShadow = true
  buildingGroup.add(annexeRoof)

  // ----------------------------------------------------------
  // 5. ENTRANCE CANOPY & PORTICO OVERHANG
  // ----------------------------------------------------------
  // Sloped entrance canopy roof (brownish-grey tiles)
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(15, 0.3, 4.5),
    new THREE.MeshLambertMaterial({ color: 0x48423f, roughness: 0.9 })
  )
  canopy.position.set(0, 5.3, 12.8)
  canopy.rotation.x = 0.14 // sloped forward
  canopy.castShadow = true
  buildingGroup.add(canopy)

  // ----------------------------------------------------------
  // 6. CURVED SIGNAGE FASCIA ("Sports HALL 2" & Panels)
  // ----------------------------------------------------------
  const leftSignMat = new THREE.MeshLambertMaterial({
    map: makeSignTexture('UTM SPORTS', '#791218', '#ffffff')
  })
  const centerSignMat = new THREE.MeshLambertMaterial({
    map: makeSignTexture('Sports HALL 2', '#dfdfdf', '#111111', true)
  })
  const rightSignMat = new THREE.MeshLambertMaterial({
    map: makeSignTexture('Sports Excellence', '#791218', '#ffffff')
  })

  // Left Sign Panel (angled)
  const fasciaL = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.8, 0.25), leftSignMat)
  fasciaL.position.set(-4.5, 5.7, 14.8)
  fasciaL.rotation.y = 0.12
  buildingGroup.add(fasciaL)

  // Center Sign Panel (straight, slightly forward)
  const fasciaC = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.0, 0.3), centerSignMat)
  fasciaC.position.set(0, 5.8, 15.0)
  buildingGroup.add(fasciaC)

  // Right Sign Panel (angled)
  const fasciaR = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.8, 0.25), rightSignMat)
  fasciaR.position.set(4.5, 5.7, 14.8)
  fasciaR.rotation.y = -0.12
  buildingGroup.add(fasciaR)

  // ----------------------------------------------------------
  // 7. TWO RED tiled CYLINDRICAL COLUMNS
  // ----------------------------------------------------------
  const columnMat = new THREE.MeshLambertMaterial({
    map: makeTileTexture(),
    roughness: 0.6
  })
  const columnGeo = new THREE.CylinderGeometry(0.55, 0.55, 5.1, 24)
  for (const x of [-5.5, 5.5]) {
    const column = new THREE.Mesh(columnGeo, columnMat)
    column.position.set(x, 2.5, 14.1)
    column.castShadow = true
    buildingGroup.add(column)
  }

  // ----------------------------------------------------------
  // 8. ENTRANCE STEPS & PORTICO FLOOR (cream tile)
  // ----------------------------------------------------------
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
    buildingGroup.add(step)
  }

  // Lobby Tiled Floor
  const porticoFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 11),
    floorMat
  )
  porticoFloor.rotation.x = -Math.PI / 2
  porticoFloor.position.set(0, 0.02, 6.5)
  porticoFloor.receiveShadow = true
  buildingGroup.add(porticoFloor)

  // ----------------------------------------------------------
  // 9. LOBBY INTERIOR ASSETS (staircase, vending machine, mailboxes, banner)
  // ----------------------------------------------------------
  // Staircase (stairs going up on the left side of the lobby)
  const stepGeo = new THREE.BoxGeometry(2.4, 0.22, 0.42)
  const stairCount = 10
  for (let i = 0; i < stairCount; i++) {
    const step = new THREE.Mesh(stepGeo, floorMat)
    step.position.set(-4.5, 0.11 + i * 0.22, 9.0 - i * 0.4)
    step.castShadow = true
    step.receiveShadow = true
    buildingGroup.add(step)
  }

  // Stair Railings (black metal poles)
  const railingGeo = new THREE.BoxGeometry(0.05, 1.2, 0.05)
  for (let i = 0; i < stairCount; i += 3) {
    const rail = new THREE.Mesh(railingGeo, railingMat)
    rail.position.set(-3.3, 0.7 + i * 0.22, 9.0 - i * 0.4)
    buildingGroup.add(rail)
  }
  const railBarGeo = new THREE.BoxGeometry(0.04, 0.04, 4.5)
  const railBar = new THREE.Mesh(railBarGeo, railingMat)
  railBar.position.set(-3.3, 1.8, 7.2)
  railBar.rotation.x = 0.5 // sloped rail bar matching steps
  buildingGroup.add(railBar)

  // JDT Vending Machine (Blue/red machine on right wall)
  const vendingMat = new THREE.MeshLambertMaterial({ map: makeVendingTexture() })
  const vendingMachine = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 2.2, 0.75),
    vendingMat
  )
  vendingMachine.position.set(5.5, 1.1, 7.0)
  vendingMachine.rotation.y = -Math.PI / 2
  vendingMachine.castShadow = true
  vendingMachine.name = 'VendingMachine'
  buildingGroup.add(vendingMachine)

  // Mailboxes (grey cabinet next to lobby entrance)
  const mailboxMat = new THREE.MeshLambertMaterial({ color: 0xd0d4dc })
  const mailbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 1.6, 2.0),
    mailboxMat
  )
  mailbox.position.set(-6.7, 0.8, 9.5)
  buildingGroup.add(mailbox)

  // NVDP Volleyball Center Wall Banner (Maroon banner on left wall)
  const bannerMat = new THREE.MeshLambertMaterial({ map: makeBannerTexture() })
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 0.8),
    bannerMat
  )
  banner.position.set(-6.85, 1.8, 6.0)
  banner.rotation.y = Math.PI / 2 // face inwards
  buildingGroup.add(banner)

  // ----------------------------------------------------------
  // 10. FOUR GLOBE LAMP POSTS
  // ----------------------------------------------------------
  const shaftGeo = new THREE.CylinderGeometry(0.08, 0.08, 6, 12)
  const shaftMat = new THREE.MeshLambertMaterial({ color: 0x7b7b7f, roughness: 0.5 })
  const globeGeo = new THREE.SphereGeometry(0.35, 16, 16)
  const globeMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    emissive: 0x000000,
    roughness: 0.3
  })

  // Placed along the two grass islands flanking the driveway:
  // Left island: x = -7.5 (z = 10, 30)
  // Right island: x = 7.5 (z = 10, 30)
  const lampPositions = [
    [-7.5, 10],
    [-7.5, 30],
    [7.5, 10],
    [7.5, 30]
  ]
  for (const [x, z] of lampPositions) {
    const shaft = new THREE.Mesh(shaftGeo, shaftMat)
    shaft.position.set(x, 3.06, z) // center of 6-unit pole on top of grass
    shaft.castShadow = true
    buildingGroup.add(shaft)

    const globe = new THREE.Mesh(globeGeo, globeMat.clone())
    globe.position.set(x, 6.06, z) // sits on top of pole
    globe.name = 'LampGlobe'
    scene.add(globe) // Add to root scene so highlight / lighting can easily reference it
    lampGlobes.push(globe)

    // PointLight embedded inside the globe (turned on at night by lighting.js)
    const light = new THREE.PointLight(0xfff0c8, 0, 18, 0.8)
    light.position.set(x, 6.06, z)
    lampLights.push(light)
  }

  return { building: buildingGroup, lampLights, lampGlobes }
}
