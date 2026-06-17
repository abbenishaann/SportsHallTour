import * as THREE from 'three'

// Builds 10 very tall tropical rainforest trees scattered (not in rows) around
// the sides and back of the parking area. Each tree has a thin tall trunk and
// an irregular canopy made of several overlapping spheres.
//
// Returns: array of canopy sphere meshes (used as hover-highlight targets).
export function buildTrees(scene) {
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, 12, 10)
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3d2b1f })

  // Two canopy greens to alternate between.
  const canopyGreens = [0x2d5a27, 0x3a6b2e]

  // Scattered positions (x, z) — deliberately uneven.
  const positions = [
    [-22, 15],
    [-25, 25],
    [-20, 35],
    [-18, 42],
    [22, 15],
    [26, 28],
    [21, 38],
    [24, 44],
    [-10, 48],
    [10, 48]
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

    // Trunk (centre at y=6 so it spans the ground up to y=12).
    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.y = 6
    trunk.castShadow = true
    tree.add(trunk)

    // Irregular canopy of overlapping spheres, sitting on top of the trunk.
    const baseColor = canopyGreens[i % 2]
    blobs.forEach((b, j) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(b.r, 12, 12),
        new THREE.MeshLambertMaterial({
          // alternate the two greens within each canopy too
          color: j % 2 === 0 ? baseColor : canopyGreens[(i + 1) % 2]
        })
      )
      // small natural jitter on top of the fixed offsets
      const jx = (Math.random() - 0.5) * 1.5
      const jz = (Math.random() - 0.5) * 1.5
      sphere.position.set(b.x + jx, 12 + b.y, b.z + jz)
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
