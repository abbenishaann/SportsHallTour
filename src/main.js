import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createScene } from './scene.js';
import { TourControls } from './controls.js';
import { TourInteractions } from './interactions.js';
import './style.css';

// 1. Core State variables
let scene, camera, renderer, controls, interactions;
let clock;
let collidableObjects = [];

// Lighting references (for the Day/Night toggle)
let ambientLight, sunLight, hemiLight;
let nightLights = [];
let isNight = false;

// Day/Night transition state. dayNightT interpolates 0 (day) -> 1 (night);
// it is eased toward dayNightTarget every frame using deltaTime, so the change
// is smooth and frame-rate independent (no tween engine needed).
let dayNightT = 0;
let dayNightTarget = 0;
const DAY_LIGHT = { ambient: 0.6, sun: 1.2, hemi: 0.4, exposure: 1.0, night: 0.0, sky: '#9ecbed' };
const NIGHT_LIGHT = { ambient: 0.12, sun: 0.18, hemi: 0.1, exposure: 0.95, night: 2.4, sky: '#0a1224' };
const DAY_SKY = new THREE.Color(DAY_LIGHT.sky);
const NIGHT_SKY = new THREE.Color(NIGHT_LIGHT.sky);
const DAYNIGHT_SECONDS = 0.9; // duration of the transition

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const loadingStatus = document.getElementById('loading-status');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-percentage');

const welcomeScreen = document.getElementById('welcome-screen');
const btnStart = document.getElementById('btn-start');

const hudOverlay = document.getElementById('hud-overlay');

const infoPanel = document.getElementById('info-panel');
const infoCloseBtn = document.getElementById('info-close');

const boardModal = document.getElementById('board-modal');
const boardModalCloseBtn = document.getElementById('board-modal-close');
const boardNavPrevBtn = document.getElementById('board-nav-prev');
const boardNavNextBtn = document.getElementById('board-nav-next');

const btnDayNight = document.getElementById('btn-daynight');
const btnPath = document.getElementById('btn-path');
const hudInspector = document.getElementById('hud-inspector');

// 2. Initialize application
function init() {
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error("Critical Error: #canvas-container element not found in DOM.");
    return;
  }

  // Set up Three.js scene environment
  const sceneData = createScene(container);
  scene = sceneData.scene;
  camera = sceneData.camera;
  renderer = sceneData.renderer;
  ambientLight = sceneData.ambientLight;
  sunLight = sceneData.sunLight;
  hemiLight = sceneData.hemiLight;

  // Interior lights that switch on at night (off during the day).
  createNightLights();

  clock = new THREE.Clock();

  // Instantiate controls system (OrbitControls look-around + WASD walking)
  controls = new TourControls(camera, renderer.domElement, collidableObjects);

  // Instantiate interactions (beacons, spotlights, and toggles)
  interactions = new TourInteractions(scene, camera, controls);

  // Load the campus model
  loadCampusModel();

  // Bind interface events
  bindUIEvents();
  
  // Start animation loop
  animate();
}

// 3. GLB Loader with progressive loading feedback
function loadCampusModel() {
  const loader = new GLTFLoader();
  
  // Define GLB URL - served from /public/models
  const modelUrl = 'models/sportsHall2.glb';
  
  // Hardcoded model size in bytes (6451044 bytes) to ensure accurate progress reporting
  const ESTIMATED_TOTAL_BYTES = 6451044;

  loadingStatus.textContent = "Downloading Sports Hall 3D model...";

  loader.load(
    modelUrl,
    // On load success
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);

      // --- Normalize the model into the app's coordinate frame ---------------
      // The source GLB is authored at ~6x human scale with its floor at y~4 and
      // its centre far from the origin (x~-92). Left untouched, the camera and
      // hotspots (which live in a small frame near the origin, floor at y=0)
      // end up buried inside/below the model. We apply a single uniform scale +
      // recenter so the building's floor sits on y=0, its footprint is a
      // walkable ~44 units, and its centre is the origin - lining it up with
      // the existing ground plane, exterior road, camera and hotspot frame.
      const rawBox = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const TARGET_FOOTPRINT = 44; // world units across the largest horizontal axis
      const normScale = TARGET_FOOTPRINT / Math.max(rawSize.x, rawSize.z);
      model.scale.setScalar(normScale);
      model.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.x -= center.x;      // centre horizontally on origin
      model.position.z -= center.z;
      model.position.y -= box.min.y;     // drop floor onto y = 0
      model.updateMatrixWorld(true);

      // Maps a point from the model's ORIGINAL (pre-normalization) space into
      // final world space, so hotspot anchors defined against the raw model
      // land exactly on their features. (Uniform scale, no rotation.)
      const glbToWorld = (p) =>
        new THREE.Vector3(p.x, p.y, p.z).multiplyScalar(normScale).add(model.position);

      const size = box.getSize(new THREE.Vector3());
      console.log("=========================================");
      console.log("GLB Model loaded & normalized. scale:", normScale.toFixed(4));
      console.log("Footprint (world units):", size.x.toFixed(1), size.y.toFixed(1), size.z.toFixed(1));
      console.log("=========================================");

      // Propagate shadows throughout the loaded geometry
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Note: Since we disabled mesh-level collisions to prevent locks,
          // we traverse and catalog wall elements for general reference.
          const nameLower = child.name.toLowerCase();
          const isFloor = nameLower.includes('floor') || 
                          nameLower.includes('ground') || 
                          nameLower.includes('grass') || 
                          nameLower.includes('path') ||
                          nameLower.includes('road') ||
                          nameLower.includes('terrain');

          if (!isFloor) {
            collidableObjects.push(child);
          }
        }
      });

      // Register meshes for raycasting, place hotspots on their real features,
      // and build the wall banner - all in the normalized world frame.
      interactions.onModelReady(model, glbToWorld);

      // Hide loader, transition to start screen
      loadingScreen.classList.add('hidden');
      welcomeScreen.classList.remove('hidden');
    },
    // On progress
    (xhr) => {
      let total = xhr.total || ESTIMATED_TOTAL_BYTES;
      let loaded = xhr.loaded;
      let percent = Math.min(Math.round((loaded / total) * 100), 100);
      
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `${percent}%`;
      loadingStatus.textContent = `Downloading: ${(loaded / (1024 * 1024)).toFixed(1)} MB / ${(total / (1024 * 1024)).toFixed(1)} MB`;
    },
    // On load failure
    (error) => {
      console.error("Failed to load UTM model. Falling back to placeholder room.", error);
      loadingStatus.textContent = "Error loading model. Launching placeholder campus...";
      
      // Create a decorative placeholder hall structure so the project doesn't break
      createPlaceholderHall();
      
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
        welcomeScreen.classList.remove('hidden');
      }, 2000);
    }
  );
}

/**
 * Fallback generator in case the GLB fails to load.
 */
function createPlaceholderHall() {
  const hallGeo = new THREE.BoxGeometry(24, 8, 30);
  const hallMat = new THREE.MeshStandardMaterial({
    color: 0x4d2836, // Dark maroon walls
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.BackSide
  });
  const placeholderHall = new THREE.Mesh(hallGeo, hallMat);
  placeholderHall.position.set(0, 4, 0);
  placeholderHall.receiveShadow = true;
  scene.add(placeholderHall);
  collidableObjects.push(placeholderHall);

  // Add decorative banners representing UTM colors
  const bannerGeo = new THREE.PlaneGeometry(3, 6);
  const bannerMat = new THREE.MeshStandardMaterial({ color: 0x8A1538, side: THREE.DoubleSide });
  const banner = new THREE.Mesh(bannerGeo, bannerMat);
  banner.position.set(-11.9, 4, 0);
  banner.rotation.y = Math.PI / 2;
  scene.add(banner);
}

// 4. Bind UI Click handlers
function bindUIEvents() {
  // Click start button on Welcome Screen
  btnStart.addEventListener('click', () => {
    startTour();
  });

  // Click info panel close button
  infoCloseBtn.addEventListener('click', () => {
    infoPanel.classList.add('hidden');
  });

  // Notice board gallery modal controls
  boardModalCloseBtn.addEventListener('click', () => {
    interactions.closeNoticeBoard();
  });

  boardNavPrevBtn.addEventListener('click', () => {
    interactions.navigateBoardImage(-1);
  });

  boardNavNextBtn.addEventListener('click', () => {
    interactions.navigateBoardImage(1);
  });

  // Click outside the modal content closes it
  boardModal.addEventListener('click', (event) => {
    if (event.target === boardModal) {
      interactions.closeNoticeBoard();
    }
  });

  // ESC closes the notice board modal
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !boardModal.classList.contains('hidden')) {
      interactions.closeNoticeBoard();
    }
  });

  // Day / Night lighting toggle
  if (btnDayNight) btnDayNight.addEventListener('click', toggleDayNight);

  // Navigation path show / hide toggle
  if (btnPath) {
    btnPath.addEventListener('click', () => {
      const visible = interactions.toggleNavPath();
      btnPath.setAttribute('aria-pressed', String(visible));
      const label = document.getElementById('path-label');
      if (label) label.textContent = visible ? 'Hide Path' : 'Show Path';
    });
  }

  // Ctrl+I toggles the developer Inspector panel
  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey && (event.key === 'i' || event.key === 'I')) {
      event.preventDefault();
      if (hudInspector) hudInspector.classList.toggle('hidden');
    }
  });
}

/**
 * Creates warm interior point lights that are off during the day and fade on
 * at night. Positioned across the (normalized) building interior.
 */
function createNightLights() {
  const positions = [
    [-14, 9, -6], [2, 9, -6], [16, 9, -6],
    [-6, 9, 8], [10, 9, 8]
  ];
  positions.forEach(([x, y, z]) => {
    const light = new THREE.PointLight(0xffe6b0, 0, 22, 2);
    light.position.set(x, y, z);
    scene.add(light);
    nightLights.push(light);
  });
}

/**
 * Applies a day<->night blend factor t (0 = day, 1 = night) to every affected
 * light, the exposure, and the sky/fog colour.
 */
function applyDayNight(t) {
  const lerp = (a, b) => a + (b - a) * t;
  if (ambientLight) ambientLight.intensity = lerp(DAY_LIGHT.ambient, NIGHT_LIGHT.ambient);
  if (sunLight) sunLight.intensity = lerp(DAY_LIGHT.sun, NIGHT_LIGHT.sun);
  if (hemiLight) hemiLight.intensity = lerp(DAY_LIGHT.hemi, NIGHT_LIGHT.hemi);
  if (renderer) renderer.toneMappingExposure = lerp(DAY_LIGHT.exposure, NIGHT_LIGHT.exposure);
  nightLights.forEach((l) => { l.intensity = lerp(DAY_LIGHT.night, NIGHT_LIGHT.night); });
  if (scene.background && scene.background.isColor) scene.background.copy(DAY_SKY).lerp(NIGHT_SKY, t);
  if (scene.fog && scene.fog.color) scene.fog.color.copy(DAY_SKY).lerp(NIGHT_SKY, t);
}

/**
 * Advances the day/night blend toward its target each frame. Called from the
 * animation loop; frame-rate independent via deltaTime.
 */
function updateDayNight(deltaTime) {
  if (dayNightT === dayNightTarget) return;
  const step = deltaTime / DAYNIGHT_SECONDS;
  if (dayNightTarget > dayNightT) dayNightT = Math.min(dayNightTarget, dayNightT + step);
  else dayNightT = Math.max(dayNightTarget, dayNightT - step);
  applyDayNight(dayNightT);
}

/**
 * Toggles between day and night. Flips the target the loop eases toward, and
 * updates the beacons, button label/icon, and HUD checklist immediately.
 */
function toggleDayNight() {
  isNight = !isNight;
  dayNightTarget = isNight ? 1 : 0;

  // Brighten hotspots at night.
  if (interactions) interactions.setNightMode(isNight);

  // Update button label/icon.
  if (btnDayNight) {
    btnDayNight.setAttribute('aria-pressed', String(isNight));
    const icon = document.getElementById('daynight-icon');
    const label = document.getElementById('daynight-label');
    if (icon) icon.textContent = isNight ? '☀' : '🌙';
    if (label) label.textContent = isNight ? 'Day' : 'Night';
  }

  // Mark the HUD checklist item for toggling the lights.
  const chkLight = document.getElementById('chk-light');
  if (chkLight) chkLight.classList.add('checked');
}

function startTour() {
  // Hide overlays, expose tour HUD, and enable walking/mouse movement
  welcomeScreen.classList.add('hidden');
  hudOverlay.classList.remove('hidden');
  controls.setEnabled(true);
}

// 5. Main Animation Loop
function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  // Ease the Day/Night lighting toward its target.
  updateDayNight(deltaTime);

  // Update camera translations and targets (WASD keys movement)
  if (controls) {
    controls.update(deltaTime);
  }

  // Update floating beacons, light updates, and TWEEN animations
  if (interactions) {
    interactions.update(elapsedTime);
  }

  // Render Frame
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Fire initialization on DOM Load
window.addEventListener('DOMContentLoaded', () => {
  init();
});
