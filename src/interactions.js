import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { hotspots, noticeBoard, volleyballBanner } from './locations.js';

/**
 * TourInteractions
 * 
 * Manages raycasting, object highlights, interactive beacons, and lighting toggles.
 * Removed programmatic double doors. Click transitions smoothly pan the camera using OrbitControls.
 */
export class TourInteractions {
  /**
   * @param {THREE.Scene} scene - The active scene
   * @param {THREE.Camera} camera - The active camera
   * @param {TourControls} controls - The controls manager instance
   * @param {Object} sceneData - Scene lighting references
   */
  constructor(scene, camera, controls, sceneData) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.sceneData = sceneData;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Registry for interactive objects
    this.interactiveObjects = [];
    this.hotspotObjects = []; // Prioritized hotspots for raycasting
    this.hoveredObject = null;
    this.originalEmissive = new Map(); // Store original emissive colors

    // Hotspot beacons references
    this.beacons = [];
    
    // Light toggle state
    this.lightOn = true;
    this.campusSpotLight = null;
    this.lampBulbMesh = null;

    // Notice board gallery state
    this.noticeBoardMesh = null;
    this.boardImageIndex = 0;

    this.init();
  }

  init() {
    // Beacons are created in onModelReady() once the model is loaded and
    // normalized, so anchors resolve to real feature positions. The lamp post
    // and input listeners can be set up immediately.
    this.createProgrammaticLightPost();
    this.setupListeners();
  }

  /**
   * Called by main.js after the GLB is loaded and normalized into world space.
   * @param {THREE.Object3D} model - the normalized model root
   * @param {(p:{x,y,z})=>THREE.Vector3} glbToWorld - maps raw-model anchor
   *   coordinates into final world coordinates.
   */
  onModelReady(model, glbToWorld) {
    this.glbToWorld = glbToWorld;
    this.registerGLBModels(model);
    this.createBeacons();
    this.createVolleyballBanner();
    this.createNavPath();
  }

  /**
   * Builds a glowing navigation route that follows the walking path from the
   * entrance through the interior hotspots. Hidden by default; toggled by the
   * "Show / Hide Path" button. Rendered as a gold tube on the floor with cone
   * arrows pointing along the direction of travel.
   */
  createNavPath() {
    const group = new THREE.Group();
    group.name = 'nav_path';

    const FLOOR_Y = 0.15; // just above the floor so markers never sink or float
    const order = ['entrance', 'court', 'equipment', 'basketball', 'deck'];
    const pts = [new THREE.Vector3(0, FLOOR_Y, 34)]; // start out on the approach path
    order.forEach((id) => {
      const s = hotspots.find((h) => h.id === id);
      if (s && s.position) pts.push(new THREE.Vector3(s.position.x, FLOOR_Y, s.position.z));
    });
    if (pts.length < 2) return;

    // Smooth glowing tube following the route.
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
    const tubeGeo = new THREE.TubeGeometry(curve, pts.length * 24, 0.14, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xF1A400,
      emissive: 0xF1A400,
      emissiveIntensity: 0.9,
      roughness: 0.3,
      metalness: 0.4,
      transparent: true,
      opacity: 0.9
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.renderOrder = 998;
    group.add(tube);

    // Direction arrows spaced along the curve.
    const arrowCount = pts.length * 3;
    const arrowGeo = new THREE.ConeGeometry(0.35, 0.8, 12);
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0xffd968,
      emissive: 0xF1A400,
      emissiveIntensity: 0.7,
      roughness: 0.3
    });
    for (let i = 0; i < arrowCount; i++) {
      const t = (i + 0.5) / arrowCount;
      const pos = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.position.copy(pos);
      arrow.position.y = FLOOR_Y + 0.05;
      // Cone points +Y by default; rotate to lie flat pointing along the tangent.
      const flat = new THREE.Vector3(tan.x, 0, tan.z).normalize();
      arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), flat);
      group.add(arrow);
    }

    group.visible = false;
    this.scene.add(group);
    this.navPathGroup = group;
  }

  /**
   * Shows/hides the navigation route. Returns the new visibility state.
   */
  toggleNavPath() {
    if (!this.navPathGroup) return false;
    this.navPathGroup.visible = !this.navPathGroup.visible;
    return this.navPathGroup.visible;
  }

  /**
   * Brightens hotspot beacons at night so they stay easy to spot in low light.
   * @param {boolean} isNight
   */
  setNightMode(isNight) {
    const boost = isNight ? 1.6 : 0.5;
    this.beacons.forEach((group) => {
      group.traverse((child) => {
        if (child.isMesh && child.material && child.material.emissive) {
          child.material.emissiveIntensity = boost;
        }
      });
    });
  }

  /**
   * Generates floating 3D beacons at each hotspot's resolved world position.
   */
  createBeacons() {
    hotspots.forEach((spot) => {
      // Skip light switch coordinates for floating beacons, as it has a custom post mesh
      if (spot.id === "light_switch") return;

      // Resolve the hotspot's world position from its GLB-space anchor.
      const world = (spot.anchor && this.glbToWorld)
        ? this.glbToWorld(spot.anchor)
        : new THREE.Vector3(spot.position.x, spot.position.y, spot.position.z);
      // Persist for camera tweening and animation.
      spot.position = { x: world.x, y: world.y, z: world.z };
      spot.cameraLook = { x: world.x, y: world.y, z: world.z };

      const group = new THREE.Group();
      group.position.set(world.x, world.y + 0.4, world.z);
      group.name = `beacon_${spot.id}`;
      // store the hotspot's base Y on the group so animation uses correct reference
      group.userData = group.userData || {};
      group.userData.baseY = world.y;

      // Outer gold ring
      const ringGeo = new THREE.TorusGeometry(0.3, 0.05, 8, 24);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xF1A400, // UTM Gold
        emissive: 0xF1A400,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.castShadow = true;
      ring.renderOrder = 999;
      group.add(ring);

      // Inner pulse diamond (Octahedron)
      const coreGeo = new THREE.OctahedronGeometry(0.18);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x8A1538, // UTM Maroon
        emissive: 0x8A1538,
        emissiveIntensity: 0.3,
        roughness: 0.2,
        metalness: 0.5,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 0.95
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = 0;
      core.castShadow = true;
      core.renderOrder = 999;
      group.add(core);

      // Ensure beacon components render on top of scene geometry so they're
      // visible when partially inside walls. Disable depth test/write and set
      // double-sided rendering where applicable.
      ring.material.depthTest = false;
      ring.material.depthWrite = false;
      ring.material.transparent = true;
      ring.material.opacity = 0.95;
      ring.material.side = THREE.DoubleSide;

      // Save custom identification metadata on child meshes for Raycasting
      ring.userData = { type: 'hotspot', id: spot.id, parentGroup: group };
      core.userData = { type: 'hotspot', id: spot.id, parentGroup: group };

      this.scene.add(group);
      this.beacons.push(group);
      
      // Register both for raycasting
      this.interactiveObjects.push(ring, core);
      this.hotspotObjects.push(ring, core);
    });
  }

  /**
   * Programmatically builds a lamp post with a spotlight.
   * Provides the interactive light switch toggle object.
   */
  createProgrammaticLightPost() {
    // Placed just off the entrance path, in front of the (normalized) building.
    const postX = 10;
    const postZ = 24;

    // Post Group
    const lightGroup = new THREE.Group();
    lightGroup.position.set(postX, 0, postZ);

    // 1. Metal Pole
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 4.5);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 2.25;
    pole.castShadow = true;
    pole.receiveShadow = true;
    lightGroup.add(pole);

    // 2. Lamp Bulb (Glowing sphere)
    const bulbGeo = new THREE.SphereGeometry(0.3, 16, 16);
    this.lampBulbMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffaed,
      emissiveIntensity: 1.5,
      roughness: 0.1
    });
    this.lampBulbMesh = new THREE.Mesh(bulbGeo, this.lampBulbMaterial);
    this.lampBulbMesh.position.set(0, 4.5, 0.3);
    lightGroup.add(this.lampBulbMesh);

    // 3. Switch Box (Clickable target)
    const boxGeo = new THREE.BoxGeometry(0.25, 0.4, 0.2);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xF1A400, // Gold switch box
      roughness: 0.2,
      metalness: 0.8
    });
    const switchBox = new THREE.Mesh(boxGeo, boxMat);
    switchBox.position.set(0, 1.2, 0.12);
    switchBox.castShadow = true;
    switchBox.name = "light_switch_trigger";
    switchBox.userData = { type: 'light_switch' };
    lightGroup.add(switchBox);

    this.scene.add(lightGroup);
    this.interactiveObjects.push(switchBox, this.lampBulbMesh);

    // 4. Spotlight pointing downwards to light up the path
    this.campusSpotLight = new THREE.SpotLight(0xfffaed, 5, 18, Math.PI / 3, 0.5, 1);
    this.campusSpotLight.position.set(postX, 4.5, postZ + 0.3);
    this.campusSpotLight.target.position.set(postX, 0, postZ + 2);
    this.campusSpotLight.castShadow = true;
    this.campusSpotLight.shadow.mapSize.width = 512;
    this.campusSpotLight.shadow.mapSize.height = 512;
    
    this.scene.add(this.campusSpotLight);
    this.scene.add(this.campusSpotLight.target);
  }

  /**
   * Builds a wall-mounted volleyball banner from the supplied image as a
   * textured PlaneGeometry. The plane's height is derived from the image's
   * real aspect ratio (no stretching), it casts/receives shadows, and uses
   * anisotropic + trilinear filtering for crisp text at grazing angles.
   */
  createVolleyballBanner() {
    const cfg = volleyballBanner;
    const loader = new THREE.TextureLoader();
    loader.load(cfg.image, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const aspect = (texture.image && texture.image.height)
        ? texture.image.width / texture.image.height
        : 1.4;
      const w = cfg.width;
      const h = w / aspect; // preserve aspect ratio

      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.85,
        metalness: 0.0,
        side: THREE.DoubleSide
      });
      const banner = new THREE.Mesh(geo, mat);
      banner.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
      banner.rotation.y = cfg.rotationY;
      banner.castShadow = true;
      banner.receiveShadow = true;
      banner.name = 'VolleyballBanner';

      // A thin maroon backing frame so it reads as a mounted banner, not a
      // floating decal, and never appears to intersect the wall behind it.
      const frameGeo = new THREE.PlaneGeometry(w * 1.06, h * 1.08);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x8A1538, roughness: 0.6, side: THREE.DoubleSide });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.set(0, 0, -0.03);
      banner.add(frame);

      this.scene.add(banner);
      this.volleyballBannerMesh = banner;
    });
  }

  /**
   * Registers mouse listeners for raycast triggers
   */
  setupListeners() {
    const onMouseMove = (event) => {
      // Calculate mouse position in normalized device coordinates (-1 to +1)
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.checkHover();
    };

    const onClick = (event) => {
      if (!this.controls.enabled) return;
      // Only raycast when the click actually landed on the 3D canvas - not on a
      // HUD button, info panel, or other HTML overlay sitting above it.
      if (!event.target || event.target.tagName !== 'CANVAS') return;
      this.checkClick();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);

    this.cleanupListeners = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
    };
  }

  /**
   * Checks if the pointer is hovering over any interactive elements
   */
  checkHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Prioritize hotspot beacon geometry over normal GLB meshes so hotspots are clickable through the scene.
    const hotspotIntersects = this.raycaster.intersectObjects(this.hotspotObjects, true);
    const intersects = hotspotIntersects.length > 0
      ? hotspotIntersects
      : this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      // Find the first valid interactive mesh
      let hitMesh = intersects[0].object;
      
      // Bubble up if custom interactive info is stored on parent
      while (hitMesh && !hitMesh.userData.type && hitMesh.parent) {
        hitMesh = hitMesh.parent;
      }

      if (hitMesh && hitMesh.userData.type) {
        if (this.hoveredObject !== hitMesh) {
          this.resetHover();
          this.hoveredObject = hitMesh;

          // Apply gold emissive highlight
          if (hitMesh.material && hitMesh.material.emissive) {
            this.originalEmissive.set(hitMesh.uuid, {
              color: hitMesh.material.emissive.clone(),
              intensity: hitMesh.material.emissiveIntensity
            });
            hitMesh.material.emissive.setHex(0xF1A400); // Highlight Gold
            hitMesh.material.emissiveIntensity = 1.0;
          }

          // Update HUD hovered object text
          const hoverText = document.getElementById('hovered-object-name');
          if (hoverText) {
            let name = hitMesh.name || hitMesh.userData.type;
            if (hitMesh.userData.id) {
              const spot = hotspots.find(s => s.id === hitMesh.userData.id)
                || (hitMesh.userData.id === noticeBoard.id ? noticeBoard : null);
              if (spot) name = spot.name;
            }
            hoverText.textContent = name;
          }
        }
        return;
      }
    }

    this.resetHover();
  }

  resetHover() {
    if (this.hoveredObject) {
      if (this.hoveredObject.material && this.hoveredObject.material.emissive) {
        const orig = this.originalEmissive.get(this.hoveredObject.uuid);
        if (orig) {
          this.hoveredObject.material.emissive.copy(orig.color);
          this.hoveredObject.material.emissiveIntensity = orig.intensity;
        }
      }
      this.hoveredObject = null;
      
      const hoverText = document.getElementById('hovered-object-name');
      if (hoverText) hoverText.textContent = "None";
    }
  }

  /**
   * Evaluates click intersections and triggers actions
   */
  checkClick() {
    // Only check clicks if mouse is not clicking on HTML elements (HUD overlays, panels)
    // Three.js Raycaster checks WebGL scene elements
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const hotspotIntersects = this.raycaster.intersectObjects(this.hotspotObjects, true);
    const intersects = hotspotIntersects.length > 0
      ? hotspotIntersects
      : this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      let hitMesh = intersects[0].object;
      
      // Bubble up if needed
      while (hitMesh && !hitMesh.userData.type && hitMesh.parent) {
        hitMesh = hitMesh.parent;
      }

      if (hitMesh && hitMesh.userData.type) {
        const data = hitMesh.userData;
        
        // Log clicked mesh name to console to assist user debugging/development
        console.log(`[Inspector] Clicked Mesh - Name: "${hitMesh.name}", ID: "${data.id}", Type: "${data.type}"`, hitMesh);
        
        const clickText = document.getElementById('clicked-object-name');
        if (clickText) clickText.textContent = hitMesh.name || data.type;

        // Perform specific animations or alerts
        if (data.type === 'hotspot') {
          this.triggerHotspot(data.id);
        } else if (data.type === 'light_switch') {
          this.toggleLight();
        } else if (data.type === 'notice_board') {
          this.openNoticeBoard();
        }
      }
    }
  }

  /**
   * Populates and reveals the slide-in info card: title, description, and
   * (when present) a photo and a "fun fact". An optional status line is
   * appended to the description (used by the light toggle).
   *
   * @param {Object} spot - hotspot data
   * @param {string} [extraStatus] - optional extra status line
   */
  showInfoCard(spot, extraStatus) {
    const infoPanel = document.getElementById('info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const infoImg = document.getElementById('info-image');
    const infoFact = document.getElementById('info-fact');
    const infoFactWrap = document.getElementById('info-fact-wrap');
    if (!infoPanel || !infoTitle || !infoDesc) return;

    infoTitle.textContent = spot.name;
    infoDesc.textContent = extraStatus ? `${spot.description}\n\n${extraStatus}` : spot.description;

    if (infoImg) {
      if (spot.image) {
        infoImg.src = spot.image;
        infoImg.alt = spot.name;
        infoImg.style.display = 'block';
      } else {
        infoImg.removeAttribute('src');
        infoImg.style.display = 'none';
      }
    }
    if (infoFact && infoFactWrap) {
      if (spot.funFact) {
        infoFact.textContent = spot.funFact;
        infoFactWrap.style.display = 'flex';
      } else {
        infoFactWrap.style.display = 'none';
      }
    }
    infoPanel.classList.remove('hidden');
  }

  /**
   * Displays details popup for clicked location hotspot
   *
   * @param {string} id - The hotspot identifier
   */
  triggerHotspot(id) {
    const spot = hotspots.find(s => s.id === id);
    if (!spot) return;

    this.showInfoCard(spot);

    // Mark HUD checklist item
    const chkHotspot = document.getElementById('chk-hotspots');
    if (chkHotspot) chkHotspot.classList.add('checked');

    // Smooth camera glide towards the hotspot using OrbitControls
    if (this.controls.orbitControls) {
      // Temporarily disable controls during transition to prevent camera jitter
      this.controls.orbitControls.enabled = false;

      new TWEEN.Tween(this.camera.position)
        .to({ x: spot.position.x, y: spot.position.y + 1.2, z: spot.position.z + 5 }, 1500)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();

      new TWEEN.Tween(this.controls.orbitControls.target)
        .to({ x: spot.cameraLook.x, y: spot.cameraLook.y, z: spot.cameraLook.z }, 1500)
        .easing(TWEEN.Easing.Cubic.Out)
        .onComplete(() => {
          this.controls.orbitControls.enabled = true;
        })
        .start();
    }
  }

  /**
   * Toggles lights on/off in the scene
   */
  toggleLight() {
    this.lightOn = !this.lightOn;

    // Toggle spotlight intensity
    if (this.campusSpotLight) {
      const targetIntensity = this.lightOn ? 5 : 0;
      new TWEEN.Tween(this.campusSpotLight)
        .to({ intensity: targetIntensity }, 400)
        .start();
    }

    // Update bulb glow look
    if (this.lampBulbMesh && this.lampBulbMaterial) {
      const bulbColor = this.lightOn ? 0xffffff : 0x444444;
      const bulbEmissive = this.lightOn ? 0xfffaed : 0x000000;
      const emissiveInt = this.lightOn ? 1.5 : 0.0;
      
      this.lampBulbMaterial.color.setHex(bulbColor);
      this.lampBulbMaterial.emissive.setHex(bulbEmissive);
      this.lampBulbMaterial.emissiveIntensity = emissiveInt;
    }

    // Toggle Global Scene Lights
    if (this.sceneData) {
      const ambientIntensity = this.lightOn ? 0.6 : 0.05;
      const sunIntensity = this.lightOn ? 1.2 : 0.02;
      const hemiIntensity = this.lightOn ? 0.4 : 0.02;
      
      if (this.sceneData.ambientLight) {
         new TWEEN.Tween(this.sceneData.ambientLight).to({ intensity: ambientIntensity }, 600).start();
      }
      if (this.sceneData.sunLight) {
         new TWEEN.Tween(this.sceneData.sunLight).to({ intensity: sunIntensity }, 600).start();
      }
      if (this.sceneData.hemiLight) {
         new TWEEN.Tween(this.sceneData.hemiLight).to({ intensity: hemiIntensity }, 600).start();
      }

      // Toggle Outdoor Lamps (from environment.js)
      if (this.sceneData.outdoorLamps) {
        this.sceneData.outdoorLamps.forEach((lamp) => {
          const targetLightIntensity = this.lightOn ? 3.5 : 0;
          new TWEEN.Tween(lamp.light)
            .to({ intensity: targetLightIntensity }, 400)
            .start();

          if (lamp.bulb && lamp.bulb.material) {
            const bulbColor = this.lightOn ? 0xffffff : 0x444444;
            const bulbEmissive = this.lightOn ? 0xfff2d4 : 0x000000;
            const emissiveInt = this.lightOn ? 1.3 : 0.0;
            
            lamp.bulb.material.color.setHex(bulbColor);
            lamp.bulb.material.emissive.setHex(bulbEmissive);
            lamp.bulb.material.emissiveIntensity = emissiveInt;
          }
        });
      }
    }

    // Trigger HTML panel for light info
    const lightSpot = hotspots.find(s => s.id === "light_switch");
    if (lightSpot) {
      const status = this.lightOn
        ? "[Status: The pathway spotlights are currently turned ON.]"
        : "[Status: The spotlights are currently turned OFF. Thank you for conserving energy!]";
      this.showInfoCard(lightSpot, status);
    }

    // Mark HUD checklist item
    const chkLight = document.getElementById('chk-light');
    if (chkLight) chkLight.classList.add('checked');
  }

  /**
   * Integrates additional meshes from loaded GLB into the Raycast registry.
   * e.g., mapping doors or lights inside the loaded file to active states.
   * 
   * @param {THREE.Object3D} model - The loaded GLB hierarchy root
   */
  registerGLBModels(model) {
    model.traverse((child) => {
      if (!child.isMesh) return;

      // The notice board prop gets special handling (repositioned + made a
      // gallery-opening hotspot) instead of the generic glb_mesh treatment.
      if (child.name === noticeBoard.meshName) {
        this.setupNoticeBoard(child);
        return;
      }

      // Push to interactives list to allow clicking and console logging of its details
      this.interactiveObjects.push(child);

      // Add identification tag in user data
      if (!child.userData.type) {
        child.userData.type = 'glb_mesh';
      }
    });
  }

  /**
   * Wires the notice board mesh into the hover/raycast pipeline. The board is
   * part of the normalized model, so it already sits correctly on its wall -
   * we only make it clickable here (no transform override).
   *
   * @param {THREE.Mesh} mesh - The "Message_Board" mesh from the loaded GLB
   */
  setupNoticeBoard(mesh) {
    // Clone the material so the hover-highlight emissive tint doesn't leak
    // into any other mesh sharing the same imported material instance.
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(m => m.clone());
    } else if (mesh.material) {
      mesh.material = mesh.material.clone();
    }

    mesh.userData.type = 'notice_board';
    mesh.userData.id = noticeBoard.id;

    this.interactiveObjects.push(mesh);
    this.hotspotObjects.push(mesh); // Prioritize like other hotspots for raycasting
    this.noticeBoardMesh = mesh;
  }

  /**
   * Opens the image lightbox/gallery for the notice board.
   */
  openNoticeBoard() {
    const modal = document.getElementById('board-modal');
    if (!modal) return;

    this.boardImageIndex = 0;
    this.updateBoardModalImage();
    modal.classList.remove('hidden');

    // Mark HUD checklist item (this board is one of the discoverable hotspots)
    const chkHotspot = document.getElementById('chk-hotspots');
    if (chkHotspot) chkHotspot.classList.add('checked');
  }

  /**
   * Closes the notice board gallery modal.
   */
  closeNoticeBoard() {
    const modal = document.getElementById('board-modal');
    if (modal) modal.classList.add('hidden');
  }

  /**
   * Steps the gallery forward/backward and wraps around at the ends.
   * @param {number} delta - +1 for next, -1 for previous
   */
  navigateBoardImage(delta) {
    const images = noticeBoard.images;
    this.boardImageIndex = (this.boardImageIndex + delta + images.length) % images.length;
    this.updateBoardModalImage();
  }

  /**
   * Syncs the modal DOM to the current boardImageIndex.
   */
  updateBoardModalImage() {
    const images = noticeBoard.images;
    const current = images[this.boardImageIndex];

    const modalImg = document.getElementById('board-modal-image');
    const caption = document.getElementById('board-modal-caption');
    const counter = document.getElementById('board-modal-counter');
    const prevBtn = document.getElementById('board-nav-prev');
    const nextBtn = document.getElementById('board-nav-next');

    if (modalImg) {
      modalImg.src = current.src;
      modalImg.alt = current.caption || noticeBoard.name;
    }
    if (caption) caption.textContent = current.caption || '';
    if (counter) counter.textContent = images.length > 1 ? `${this.boardImageIndex + 1} / ${images.length}` : '';

    // Hide navigation entirely when there's nothing to navigate between
    const showNav = images.length > 1;
    if (prevBtn) prevBtn.style.display = showNav ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = showNav ? 'flex' : 'none';
  }

  /**
   * Drives animation updates for beacons and TWEEN engines.
   * Called in the main tick loop.
   */
  update(time) {
    // 1. Update Tween engines
    TWEEN.update();

    // 2. Animate beacons (bounce up and down, spin around)
    this.beacons.forEach((group, index) => {
      group.rotation.y += 0.015;

      // Unique phase offset per beacon for organic feel
      const phase = time * 2.5 + index * Math.PI / 3;
      // Use the stored baseY from the group's userData so skipping the light_switch doesn't
      // desynchronize indices when hotspots were filtered during creation.
      const baseY = (group.userData && typeof group.userData.baseY === 'number') ? group.userData.baseY : 1.5;
      group.position.y = baseY + 0.4 + Math.sin(phase) * 0.08;
    });
  }

  destroy() {
    if (this.cleanupListeners) this.cleanupListeners();
    this.beacons.forEach(b => this.scene.remove(b));
    this.beacons = [];
    this.interactiveObjects = [];
    this.hotspotObjects = [];
  }
}
