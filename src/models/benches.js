import * as THREE from 'three'

// Builds 4 benches (simple dark-wood boxes): two along the basketball court
// sidelines (inside the hall) and two near the entrance pathway.
//
// Returns: array of bench meshes (used as hover-highlight targets).
export function buildBenches(scene) {
  const benchGeo = new THREE.BoxGeometry(1.5, 0.4, 0.5)
  const benchMat = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.8
  })

  // [x, z, rotationY]
  const placements = [
    // Court sidelines (court is centred at z = -10)
    [-9, -4, 0],
    [9, -4, 0],
    // Entrance pathway
    [-6, 6, Math.PI / 2],
    [6, 6, Math.PI / 2]
  ]

  const benches = []
  for (const [x, z, rotY] of placements) {
    const bench = new THREE.Mesh(benchGeo, benchMat.clone())
    bench.position.set(x, 0.2, z)
    bench.rotation.y = rotY
    bench.castShadow = true
    bench.receiveShadow = true
    bench.name = 'Bench'
    scene.add(bench)
    benches.push(bench)
  }

  return benches
}
