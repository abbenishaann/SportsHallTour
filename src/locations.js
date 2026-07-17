/**
 * locations.js
 * 
 * Central data registry for interactive locations, hotspots, and elements in the UTM Sports Hall 2.
 * You can edit the text titles, descriptions, and coordinates directly in this file
 * to customize the tour points or match specific mesh coordinates of your GLB model.
 */

/**
 * Hotspots.
 *
 * `anchor` is expressed in the GLB model's OWN (pre-normalization) coordinate
 * space - i.e. the real centre of a feature as reported by the model inspector.
 * On load, main.js normalizes the model (uniform scale + recenter so the floor
 * sits at y=0 and the building centres on the origin) and applies the SAME
 * transform to these anchors, so every beacon lands exactly on its real feature
 * regardless of the model's odd native scale/offset. `funFact` and `image`
 * enrich the info card. `position`/`cameraLook` are filled in at runtime.
 */
export const hotspots = [
  {
    id: "entrance",
    name: "Main Entrance (Lobby)",
    description: "Welcome to UTM Sports Hall 2 (Dewan Sukan 2). This lobby serves as the main registration point for sports tournaments, state examinations (e.g. SPM/STPM), and academic events. Built to support the active campus life of Universiti Teknologi Malaysia.",
    funFact: "Dewan Sukan 2 regularly doubles as an official examination hall, seating hundreds of candidates during the SPM and STPM seasons.",
    image: "/images/board/volleyball-coaching-board.png",
    anchor: { x: -51.6, y: 7, z: 53 }
  },
  {
    id: "court",
    name: "Indoor Multisport Court",
    description: "The main hall features high-grade flooring marked for multiple indoor games including Badminton, Basketball, Volleyball, and Futsal. It is equipped with spectator seating and host ventilation systems to maintain a cool environment during intense matches.",
    funFact: "The same floor carries overlaid line markings for four different sports at once - players learn to read only the colour that matters for their game.",
    image: "/images/board/volleyball-coaching-board.png",
    anchor: { x: -76, y: 7, z: -14.5 }
  },
  {
    id: "deck",
    name: "Technical Control & Scoring Deck",
    description: "Positioned at the side of the court, the Technical Control Deck houses the digital scoreboard controls, public address (PA) sound systems, and referee seats. It ensures smooth coordination during UTM inter-college sports competitions (Sukan Antara Kolej - SAK).",
    funFact: "During SAK week this small deck coordinates scoring for matches running back-to-back from morning until night.",
    anchor: { x: -44, y: 7, z: 62 }
  },
  {
    id: "light_switch",
    name: "Eco-Campus Light Controller",
    description: "UTM is committed to a green, sustainable campus. This interactive controller toggles the main arena floodlights. Toggle it off when leaving the hall to support the university's energy conservation campaign.",
    funFact: "UTM's sustainability drive has made it one of the greenest campuses in the region - every switch counts.",
    // No anchor: this hotspot is the programmatic lamp post built in interactions.js.
    position: { x: 8, y: 1.5, z: 18 },
    cameraLook: { x: 8, y: 1.5, z: 12 }
  },
  {
    id: "basketball",
    name: "Basketball Court",
    description: "A full-size basketball court used for faculty matches, training sessions, and student recreation. Regulation hoops and spectator space make it a favourite for inter-college friendlies.",
    funFact: "Pick-up games here run late into the evening - the court is one of the most-booked facilities on campus.",
    anchor: { x: -157, y: 7, z: -14.5 }
  },
  {
    id: "equipment",
    name: "Sports Equipment & Gym Area",
    description: "A fitness zone stocked with treadmills, weights, and training mats, plus storage for the equipment used across the hall's events.",
    funFact: "The treadmills and free weights make this a mini-gym, so athletes can warm up without leaving the building.",
    anchor: { x: -2.7, y: 7, z: -35 }
  }
];

/**
 * Notice board prop (mesh name "Message_Board" inside the GLB).
 * It is part of the building and is normalized together with the rest of the
 * model on load, so it already sits correctly on its wall - we no longer pull
 * it out to a separate transform (the old override dropped it BELOW the
 * building floor). setupNoticeBoard() now only makes it clickable.
 */
export const noticeBoard = {
  id: "notice_board",
  name: "Volleyball Coaching Notice Board",
  meshName: "Message_Board",
  images: [
    {
      src: "/images/board/volleyball-coaching-board.png",
      caption: "FIVB Volleyball Coaching Techniques — Serving (Jump Spin / Jump Float Serve) & Passing (Low Reception)"
    }
  ]
};

/**
 * Wall-mounted volleyball banner (built programmatically as a textured
 * PlaneGeometry in interactions.js). Positioned in FINAL WORLD coordinates
 * (after model normalization). Flush against the interior wall near the
 * entrance, aspect ratio preserved from the source image.
 */
export const volleyballBanner = {
  image: "/images/board/volleyball-coaching-board.png",
  width: 6,               // world units; height derived from image aspect ratio
  position: { x: -18, y: 4.2, z: -2 },
  rotationY: Math.PI / 2  // face +X (into the hall)
};

export const collisionBounds = {
  minX: -45,
  maxX: 45,
  minZ: -45,
  maxZ: 45,
  minY: 0,
  maxY: 20
};

export const defaultSettings = {
  movementSpeed: 10.0, // Walking speed
  turnSpeed: 0.002,
  playerHeight: 1.8, // Eye level for a natural ground-level walk
  startPosition: { x: 0, y: 1.8, z: 42.0 }, // In front of the hall, at walking height
  startLookAt: { x: 0, y: 1.8, z: 0 }, // Look towards the building center at the same eye level
  lightColorOn: 0xffffff,
  lightColorOff: 0x222233
};
