import * as THREE from 'three';

/**
 * environment.js
 *
 * Builds the exterior campus grounds (road, parking lot, kerbs, pavement
 * verge, and lamp posts) around the Sports Hall 2 GLB model.
 *
 * The GLB's own internal node coordinates are not usable as an alignment
 * reference: its raw bounding box is ~224 x 100 x 182 units and off-center
 * (see the "Message_Board" repositioning note in locations.js for the same
 * issue on a smaller scale). The project already establishes its own
 * ground-truth coordinate frame instead - the one hotspots, the camera
 * start position, and collisionBounds all live in (roughly x:-12..12,
 * z:-6..8 for the walkable interior, camera starting at z=32 looking back
 * toward the entrance at z=8). Everything below is positioned in that same
 * frame, directly in front of the entrance, so it lines up with the hall
 * as the player actually experiences it. The GLB model itself is never
 * translated, rotated, or rescaled.
 */

const COLORS = {
  pavementVerge: 0x6b6f73,
  asphalt: 0x2f3235,
  kerb: 0xd6d6d0,
  lineWhite: 0xf2f2f2,
  lineBlue: 0x1a5fb4,
  grassVerge: 0x35502f,
  lampPole: 0x3a3a3a,
  lampBulb: 0xfff2d4
};

// Zones, measured along Z outward from the entrance (pavement already
// ends at z=30 in scene.js's existing forecourt path).
const PAVEMENT_END_Z = 30;
const KERB_WIDTH = 0.25;
const PARKING_DEPTH = 7;
const ROAD_DEPTH = 7;

const PARKING_START_Z = PAVEMENT_END_Z + KERB_WIDTH;
const PARKING_END_Z = PARKING_START_Z + PARKING_DEPTH;
const ROAD_START_Z = PARKING_END_Z + KERB_WIDTH;
const ROAD_END_Z = ROAD_START_Z + ROAD_DEPTH;

const PARKING_HALF_WIDTH = 20;
const ROAD_HALF_WIDTH = 22;

/**
 * Adds a raised kerb strip between two points (thin box, flat top).
 */
function createKerbSegment(scene, x1, z1, x2, z2) {
  const length = Math.hypot(x2 - x1, z2 - z1);
  const angle = Math.atan2(z2 - z1, x2 - x1);

  const geo = new THREE.BoxGeometry(length, 0.15, KERB_WIDTH);
  const mat = new THREE.MeshStandardMaterial({ color: COLORS.kerb, roughness: 0.85 });
  const kerb = new THREE.Mesh(geo, mat);
  kerb.position.set((x1 + x2) / 2, 0.075, (z1 + z2) / 2);
  kerb.rotation.y = -angle;
  kerb.receiveShadow = true;
  kerb.castShadow = true;
  scene.add(kerb);
}

/**
 * Adds a thin painted line marking (parking bay divider or road dash),
 * raised just enough above the asphalt to avoid z-fighting.
 */
function createLineMarking(scene, x, z, width, depth, color = COLORS.lineWhite, rotationY = 0) {
  const geo = new THREE.BoxGeometry(width, 0.01, depth);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, emissive: color, emissiveIntensity: 0.05 });
  const line = new THREE.Mesh(geo, mat);
  line.position.set(x, 0.015, z);
  line.rotation.y = rotationY;
  scene.add(line);
}

/**
 * Builds the parking lot surface plus painted bay markings, including one
 * accessible bay.
 */
function createParkingLot(scene) {
  const width = PARKING_HALF_WIDTH * 2;
  const centerZ = (PARKING_START_Z + PARKING_END_Z) / 2;

  const lotGeo = new THREE.PlaneGeometry(width, PARKING_DEPTH);
  const lotMat = new THREE.MeshStandardMaterial({ color: COLORS.asphalt, roughness: 0.95, metalness: 0.05 });
  const lot = new THREE.Mesh(lotGeo, lotMat);
  lot.rotation.x = -Math.PI / 2;
  lot.position.set(0, 0.005, centerZ);
  lot.receiveShadow = true;
  scene.add(lot);

  // 8 bays across the lot width, each 5 units wide, divided by white lines.
  const bayCount = 8;
  const bayWidth = width / bayCount;
  const bayLineDepth = PARKING_DEPTH * 0.85;

  for (let i = 0; i <= bayCount; i++) {
    const x = -PARKING_HALF_WIDTH + i * bayWidth;
    createLineMarking(scene, x, centerZ, 0.12, bayLineDepth, COLORS.lineWhite);
  }

  // Mark the first bay as an accessible space (blue fill + white outline).
  const accessibleX = -PARKING_HALF_WIDTH + bayWidth / 2;
  createLineMarking(scene, accessibleX, centerZ, bayWidth * 0.7, bayLineDepth * 0.7, COLORS.lineBlue);
  createLineMarking(scene, accessibleX, centerZ - bayLineDepth * 0.3, bayWidth * 0.35, 0.12, COLORS.lineWhite);
  createLineMarking(scene, accessibleX, centerZ + bayLineDepth * 0.3, bayWidth * 0.35, 0.12, COLORS.lineWhite);
}

/**
 * Builds the road surface with a dashed center line.
 */
function createRoad(scene) {
  const centerZ = (ROAD_START_Z + ROAD_END_Z) / 2;

  const roadGeo = new THREE.PlaneGeometry(ROAD_HALF_WIDTH * 2, ROAD_DEPTH);
  const roadMat = new THREE.MeshStandardMaterial({ color: COLORS.asphalt, roughness: 0.9, metalness: 0.05 });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.005, centerZ);
  road.receiveShadow = true;
  scene.add(road);

  // Dashed center line running across the road (parallel to the building
  // frontage, since the road runs left-right in front of the hall).
  const dashLength = 1.2;
  const gap = 1.2;
  const step = dashLength + gap;
  for (let x = -ROAD_HALF_WIDTH + step / 2; x < ROAD_HALF_WIDTH; x += step) {
    createLineMarking(scene, x, centerZ, dashLength, 0.12, COLORS.lineWhite);
  }
}

/**
 * Adds grass verge strips flanking the parking lot, softening the
 * transition between the hard landscaping and the main ground plane.
 */
function createGrassVerges(scene) {
  const depth = PARKING_DEPTH + ROAD_DEPTH + KERB_WIDTH;
  const centerZ = PARKING_START_Z + depth / 2;
  const vergeWidth = 6;

  [-1, 1].forEach((side) => {
    const geo = new THREE.PlaneGeometry(vergeWidth, depth);
    const mat = new THREE.MeshStandardMaterial({ color: COLORS.grassVerge, roughness: 0.95 });
    const verge = new THREE.Mesh(geo, mat);
    verge.rotation.x = -Math.PI / 2;
    verge.position.set(side * (ROAD_HALF_WIDTH + vergeWidth / 2), 0.008, centerZ);
    verge.receiveShadow = true;
    scene.add(verge);
  });
}

/**
 * Builds one decorative (non-interactive) lamp post with a warm point
 * light, visually matching the existing interactive light switch post in
 * interactions.js but without the switch/toggle behavior.
 */
function createDecorativeLampPost(scene, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const poleGeo = new THREE.CylinderGeometry(0.07, 0.11, 4.2);
  const poleMat = new THREE.MeshStandardMaterial({ color: COLORS.lampPole, metalness: 0.7, roughness: 0.4 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 2.1;
  pole.castShadow = true;
  pole.receiveShadow = true;
  group.add(pole);

  const bulbGeo = new THREE.SphereGeometry(0.22, 16, 16);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: COLORS.lampBulb,
    emissiveIntensity: 1.3,
    roughness: 0.2
  });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.y = 4.2;
  group.add(bulb);

  const light = new THREE.PointLight(COLORS.lampBulb, 3.5, 12, 2);
  light.position.set(0, 4.1, 0);
  light.castShadow = false; // Decorative only - avoid extra shadow map cost
  group.add(light);

  scene.add(group);
}

/**
 * Places lamp posts around the parking lot corners for outdoor lighting.
 */
function createParkingLotLighting(scene) {
  const nearZ = PARKING_START_Z + 0.8;
  const farZ = PARKING_END_Z - 0.8;
  const positions = [
    [-PARKING_HALF_WIDTH + 1, nearZ],
    [PARKING_HALF_WIDTH - 1, nearZ],
    [-PARKING_HALF_WIDTH + 1, farZ],
    [PARKING_HALF_WIDTH - 1, farZ]
  ];
  positions.forEach(([x, z]) => createDecorativeLampPost(scene, x, z));
}

/**
 * Entry point: builds the full exterior grounds around the (untouched)
 * Sports Hall model.
 *
 * @param {THREE.Scene} scene - The active scene, already containing the
 *   ground plane and forecourt pavement created in scene.js.
 */
export function createExteriorEnvironment(scene) {
  createKerbSegment(scene, -PARKING_HALF_WIDTH, PAVEMENT_END_Z, PARKING_HALF_WIDTH, PAVEMENT_END_Z); // pavement -> parking
  createKerbSegment(scene, -PARKING_HALF_WIDTH, PARKING_END_Z, PARKING_HALF_WIDTH, PARKING_END_Z); // parking -> road
  createKerbSegment(scene, -PARKING_HALF_WIDTH, PARKING_START_Z, -PARKING_HALF_WIDTH, PARKING_END_Z); // parking left edge
  createKerbSegment(scene, PARKING_HALF_WIDTH, PARKING_START_Z, PARKING_HALF_WIDTH, PARKING_END_Z); // parking right edge

  createParkingLot(scene);
  createRoad(scene);
  createGrassVerges(scene);
  createParkingLotLighting(scene);
}
