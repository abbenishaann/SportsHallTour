import * as THREE from 'three';

/**
 * Initializes the Day/Night toggle button and lighting transition logic.
 * @param {Object} params - Options for setting up the lighting.
 * @param {THREE.Scene} params.scene - The Three.js scene.
 * @param {THREE.WebGLRenderer} params.renderer - The Three.js renderer.
 * @param {Array<THREE.PointLight>} params.lampLights - Array of lamp point lights.
 * @param {Array<THREE.Mesh>} params.lampBulbMeshes - Array of lamp bulb meshes.
 * @returns {Function} updateLighting(delta) function to be called in the render loop.
 */
export function initDayNightToggle({ scene, renderer, lampLights, lampBulbMeshes }) {
  // Target values for transitions
  const DAY_COLOR = new THREE.Color(0x87CEEB); // Sky blue
  const NIGHT_COLOR = new THREE.Color(0x0a0a20); // Dark navy
  
  const DAY_AMBIENT = 1.0;
  const NIGHT_AMBIENT = 0.2;
  
  const DAY_LAMP_INTENSITY = 0;
  const NIGHT_LAMP_INTENSITY = 2; // Adjust based on scene scale
  
  const DAY_EMISSIVE = new THREE.Color(0x000000);
  const NIGHT_EMISSIVE = new THREE.Color(0xffddaa);

  // Initial state setup
  let isNight = false;
  scene.background = DAY_COLOR.clone();
  scene.fog = new THREE.Fog(DAY_COLOR.clone(), 10, 50);

  // We assume main.js adds a directional and ambient light, but we need to track them.
  // We'll find the ambient light in the scene. 
  // For robustness, if they don't exist, this script won't crash but will just update what it can.
  
  // Create UI Toggle Button
  const button = document.createElement('button');
  button.innerHTML = '☀️ Day Mode';
  Object.assign(button.style, {
    position: 'absolute',
    top: '20px',
    right: '20px',
    padding: '10px 16px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: '2px solid #e5e4e7',
    borderRadius: '8px',
    color: '#333',
    transition: 'all 0.3s ease',
    zIndex: '100',
    fontFamily: 'system-ui, sans-serif',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  });

  button.addEventListener('mouseover', () => {
    button.style.transform = 'scale(1.05)';
  });
  button.addEventListener('mouseout', () => {
    button.style.transform = 'scale(1)';
  });

  document.body.appendChild(button);

  button.addEventListener('click', () => {
    isNight = !isNight;
    
    if (isNight) {
      button.innerHTML = '🌙 Night Mode';
      button.style.backgroundColor = 'rgba(20, 20, 30, 0.9)';
      button.style.color = '#fff';
      button.style.borderColor = '#444';
    } else {
      button.innerHTML = '☀️ Day Mode';
      button.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      button.style.color = '#333';
      button.style.borderColor = '#e5e4e7';
    }
  });

  // Find lights in scene
  let ambientLight, directionalLight;
  scene.traverse((child) => {
    if (child.isAmbientLight) ambientLight = child;
    if (child.isDirectionalLight) directionalLight = child;
  });

  // The update function to be called in main render loop
  return function updateLighting(delta) {
    const lerpFactor = delta * 2.0; // Speed of transition

    // Target colors based on state
    const targetBgColor = isNight ? NIGHT_COLOR : DAY_COLOR;
    const targetAmbient = isNight ? NIGHT_AMBIENT : DAY_AMBIENT;
    const targetLampIntensity = isNight ? NIGHT_LAMP_INTENSITY : DAY_LAMP_INTENSITY;
    const targetEmissive = isNight ? NIGHT_EMISSIVE : DAY_EMISSIVE;

    // Lerp background and fog
    scene.background.lerp(targetBgColor, lerpFactor);
    if (scene.fog) {
      scene.fog.color.lerp(targetBgColor, lerpFactor);
    }

    // Lerp ambient light
    if (ambientLight) {
      ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, targetAmbient, lerpFactor);
    }

    // Lerp directional light (moon/sun effect)
    if (directionalLight) {
       const dirTarget = isNight ? 0.1 : 1.0;
       directionalLight.intensity = THREE.MathUtils.lerp(directionalLight.intensity, dirTarget, lerpFactor);
    }

    // Lerp lamps
    lampLights.forEach(light => {
      light.intensity = THREE.MathUtils.lerp(light.intensity, targetLampIntensity, lerpFactor);
    });

    lampBulbMeshes.forEach(mesh => {
      mesh.material.emissive.lerp(targetEmissive, lerpFactor);
    });
  };
}
