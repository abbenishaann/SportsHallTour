import * as THREE from 'three'

// Builds 18 very tall tropical rainforest trees placed along the central grass islands
// and around the perimeter of the parking area, with randomized scales for realism.
//
// Returns: array of canopy sphere meshes (used as hover-highlight targets).
export function buildTrees(scene) {
  // Two canopy greens to alternate between.
  const canopyGreens = [0x2d5a27, 0x3a6b2e, 0x427d3b]

  // Positions (x, z) designed to match the reference photos:
  // - Trees on the left island (x = -7.5) and right island (x = 7.5)
  // - Trees on the left and right outer borders (x = -32, 32)
  // - Trees on the front border slope (z = 45)
  const positions = [
    // Left grass island trees
    [-7.5, 12],
    [-7.5, 22],
    [-7.5, 32],

    // Right grass island trees
    [7.5, 12],
    [7.5, 22],
    [7.5, 32],

    // Left outer border trees
    [-31, 10],
    [-34, 20],
    [-32, 30],
    [-35, 40],

    // Right outer border trees
    [31, 10],
    [34, 20],
    [32, 30],
    [35, 40],

    // Front/Back border trees
    [-20, 44],
    [-8, 45],
    [8, 45],
    [20, 44]
  ]

  // Sphere "blob" recipe for the irregular canopy (radius + offsets).
  const blobs = [
    { r: 2.5, x: 0, y: 0, z: 0 },
    { r: 2.0, x: 1.3, y: 0.8, z: 0.6 },
    { r: 1.8, x: -1.2, y: 0.5, z: -0.9 },
    { r: 1.5, x: 0.6, y: 1.4, z: -1.1 },
    { r: 1.8, x: -0.8, y: 1.1, z: 1.2 }
  ]

  const canopyMeshes = []

  positions.forEach(([px, pz], i) => {
    const tree = new THREE.Group()

    // Height scale factor based on index to create deterministic visual variety
    const scaleFactor = 0.75 + ((i * 17) % 10) * 0.07 // 0.75 to 1.38
    const trunkHeight = 10 * scaleFactor
    const canopyBaseY = trunkHeight

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.12 * scaleFactor, 0.22 * scaleFactor, trunkHeight, 10)
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x423229 })
    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.y = trunkHeight / 2
    trunk.castShadow = true
    tree.add(trunk)

    // Irregular canopy of overlapping spheres, sitting on top of the trunk.
    const baseColor = canopyGreens[i % canopyGreens.length]
    blobs.forEach((b, j) => {
      // Scale canopy spheres by the same scale factor
      const r = b.r * scaleFactor
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(r, 12, 12),
        new THREE.MeshLambertMaterial({
          // alternate the greens within each canopy too
          color: j % 2 === 0 ? baseColor : canopyGreens[(i + 1) % canopyGreens.length]
        })
      )
      // small natural jitter on top of the fixed offsets
      const jx = (Math.sin(i * 12 + j * 9) * 0.4) * scaleFactor
      const jz = (Math.cos(i * 7 + j * 15) * 0.4) * scaleFactor
      
      sphere.position.set(
        (b.x + jx) * scaleFactor,
        canopyBaseY + (b.y + j) * 0.6 * scaleFactor,
        (b.z + jz) * scaleFactor
      )
      sphere.castShadow = true
      sphere.name = 'TreeCanopy'
      tree.add(sphere)
      canopyMeshes.push(sphere)
    })

    tree.position.set(px, 0, pz)
    scene.add(tree)
  })

  return canopyMeshes
}
