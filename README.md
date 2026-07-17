# Interactive 3D Campus Tour — UTM Sports Hall 2

An interactive, browser-based 3D tour of **Dewan Sukan 2 (Sports Hall 2), Universiti
Teknologi Malaysia**, built with [Three.js](https://threejs.org/) and Vite.
Developed for **SECV3263 Multimedia Web Programming**.

## Features

- **Explorable 3D environment** — the Sports Hall building (imported GLB) sits in a
  landscaped courtyard with an access path, road, parking bays and lamp posts.
- **Navigation** — orbit/look with the mouse, walk with **WASD / arrow keys**, zoom
  with the scroll wheel.
- **Interactive hotspots** — glowing beacons on key features (entrance, multisport
  court, basketball court, scoring deck, gym/equipment area). Clicking one glides the
  camera to it (Tween.js) and opens an information card with a description and a
  "fun fact".
- **Notice board** — click the wall-mounted board to open a centered image gallery
  overlay of the FIVB volleyball coaching poster.
- **Volleyball banner** — a wall-mounted, aspect-correct textured banner near the
  entrance.
- **Day / Night toggle** — smoothly transitions ambient/sun/hemisphere lighting, sky
  and fog colour, exposure, and switches the interior + lamp lights on at night.
- **Show / Hide Path** — toggles a glowing navigation route with direction arrows
  along the walking path.
- **Light switch** — an interactive lamp post that toggles its floodlight.
- **Clean UI** — loading screen, welcome/instructions screen, in-tour HUD checklist,
  and a developer Inspector panel (toggle with **Ctrl+I**). Responsive layout.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:3000)
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Project structure

| File | Responsibility |
|------|----------------|
| `index.html` | DOM overlays: loading, welcome, HUD, info card, notice-board modal, control bar |
| `src/main.js` | App bootstrap, GLB loading + model normalization, day/night, UI wiring, render loop |
| `src/scene.js` | Renderer, camera, lights, ground, grid, resize handling |
| `src/controls.js` | OrbitControls look/zoom + WASD walking with boundary clamping |
| `src/interactions.js` | Hotspot beacons, raycasting, info card, notice board, banner, nav path, light toggle |
| `src/locations.js` | Data: hotspots (with GLB-space anchors), notice board, banner, defaults |
| `src/environment.js` | Exterior grounds: road, parking, kerbs, verges, lamp posts |
| `src/style.css` | All UI styling (glassmorphism, UTM maroon/gold theme, responsive rules) |
| `public/models/sportsHall2.glb` | The Sports Hall 2 model |
| `public/images/board/` | Notice board / banner image |

## Controls

| Input | Action |
|-------|--------|
| Mouse drag | Look / orbit |
| Scroll | Zoom |
| W / A / S / D or arrows | Walk |
| Click a beacon / board / lamp | Trigger its interaction |
| Ctrl + I | Toggle the developer Inspector panel |
