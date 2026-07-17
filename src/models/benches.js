import * as THREE from 'three';

/**
 * Creates low-poly benches around the sports hall and adds them to the scene.
 * @param {THREE.Scene} scene - The Three.js scene to add the benches to.
 */
export function createBenches(scene) {
  // Simple low-poly bench geometry: a box for the seat and smaller boxes for legs
  const seatGeometry = new THREE.BoxGeometry(2, 0.2, 0.8);
  const legGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.6);
  
  const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
  const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

  const benchPositions = [
    { x: -6, z: 6 },
    { x: 0, z: 6 },
    { x: 6, z: 6 },
    { x: -6, z: -6 },
    { x: 0, z: -6 },
    { x: 6, z: -6 },
  ];

  benchPositions.forEach(pos => {
    const benchGroup = new THREE.Group();

    // Seat
    const seat = new THREE.Mesh(seatGeometry, woodMaterial);
    seat.position.y = 0.5;
    benchGroup.add(seat);

    // Legs
    const leftLeg = new THREE.Mesh(legGeometry, metalMaterial);
    leftLeg.position.set(-0.8, 0.2, 0);
    benchGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, metalMaterial);
    rightLeg.position.set(0.8, 0.2, 0);
    benchGroup.add(rightLeg);

    // Position the entire bench group
    benchGroup.position.set(pos.x, 0, pos.z);
    
    // Slight random rotation for natural look
    benchGroup.rotation.y = (Math.random() - 0.5) * 0.2;

    scene.add(benchGroup);
  });
}

/**
 * Creates lamp posts with point lights attached.
 * @param {THREE.Scene} scene - The Three.js scene to add the lamp posts to.
 * @returns {Object} Contains arrays of lampLights and lampBulbMeshes for lighting toggles.
 */
export function createLampPosts(scene) {
  const poleGeometry = new THREE.CylinderGeometry(0.1, 0.15, 3, 8);
  const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
  
  const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  // Bulb material will start unlit (emissive black)
  const bulbMaterialTemplate = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    emissive: 0x000000,
    emissiveIntensity: 0
  });

  const lampPositions = [
    { x: -8, z: 8 },
    { x: 8, z: 8 },
    { x: -8, z: -8 },
    { x: 8, z: -8 }
  ];

  const lampLights = [];
  const lampBulbMeshes = [];

  lampPositions.forEach(pos => {
    const lampGroup = new THREE.Group();

    // Pole
    const pole = new THREE.Mesh(poleGeometry, metalMaterial);
    pole.position.y = 1.5;
    lampGroup.add(pole);

    // Bulb Mesh
    const bulbMaterial = bulbMaterialTemplate.clone();
    const bulb = new THREE.Mesh(headGeometry, bulbMaterial);
    bulb.position.y = 3.2;
    lampGroup.add(bulb);
    lampBulbMeshes.push(bulb);

    // Point Light (off by default)
    const pointLight = new THREE.PointLight(0xffddaa, 0, 15);
    pointLight.position.y = 3.2;
    lampGroup.add(pointLight);
    lampLights.push(pointLight);

    lampGroup.position.set(pos.x, 0, pos.z);
    scene.add(lampGroup);
  });

  return { lampLights, lampBulbMeshes };
}
