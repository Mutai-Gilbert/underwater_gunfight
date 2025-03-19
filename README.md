# Underwater Gunfight

An immersive 3D underwater combat game built with Three.js.

## Features

- First-person underwater movement
- Realistic underwater environment with fog effects
- WASD/Arrow keys movement controls
- Mouse look camera control
- Randomly generated terrain with rocks
- Atmospheric lighting effects
- Weapon system with shooting mechanics
- Water surface shader effects
- Particle systems (bubbles and debris)
- Sound effects

## Installation

1. Make sure you have [Node.js](https://nodejs.org/) installed
2. Clone this repository
3. Install dependencies:
```bash
npm install
```

## Development

To run the game in development mode:

```bash
npm run dev
```

Then open your browser and navigate to `http://localhost:5173`

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

To preview the production build:

```bash
npm run preview
```

## Controls

- **W/Up Arrow**: Move forward
- **S/Down Arrow**: Move backward
- **A/Left Arrow**: Move left
- **D/Right Arrow**: Move right
- **Mouse**: Look around
- **Click**: Lock mouse pointer (required for mouse look)
- **Left Mouse Button**: Shoot
- **Esc**: Unlock mouse pointer

## Development Status

### Day 3 Progress
- Implemented weapon system with shooting mechanics
- Added bullet visualization and muzzle flash effects
- Created water surface shader with wave animation
- Added underwater particle systems (bubbles and debris)
- Integrated shooting sound effects
- Implemented hit detection using raycasting

### Day 2 Progress
- Implemented underwater environment with fog effects
- Added ocean floor and random rock formations
- Implemented first-person player movement
- Added mouse look controls
- Set up atmospheric lighting
- Prepared for 3D model loading

### TODO
- Import and integrate detailed 3D models
- Add enemy AI and combat mechanics
- Enhance particle effects
- Add more sound effects
- Implement multiplayer capabilities

## Project Structure

```
underwater_gunfight/
├── src/
│   ├── main.js           # Main game initialization
│   ├── Player.js         # Player movement and controls
│   ├── Environment.js    # Underwater environment setup
│   ├── Weapon.js         # Weapon and shooting mechanics
│   ├── WaterSurface.js   # Water shader effects
│   └── UnderwaterParticles.js # Particle systems
├── public/
│   ├── models/           # 3D model files
│   ├── textures/         # Texture files
│   ├── sounds/          # Sound effects
│   └── shaders/         # GLSL shader files
├── index.html           # Entry point
└── package.json         # Project configuration
```

## Features in Detail

### Weapon System
- Raycasting for accurate hit detection
- Bullet visualization with particle effects
- Muzzle flash effects
- Sound effects for shooting

### Water Effects
- Animated water surface using custom shaders
- Dynamic wave patterns
- Depth-based color variation

### Particle Systems
- Bubble particles with realistic movement
- Floating debris particles
- Muzzle flash particles for weapon effects

## Contributing

Contributions are welcome! Please feel free to submit pull requests with improvements or new features.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Future Plans

- Implement gun mechanics and shooting.
- Integrate physics for object interaction and water effects.
- Add enemy AI and combat.
- Enhance the environment with detailed assets and effects.
- Explore multiplayer options.

## Contributions

Contributions are welcome! Please feel free to submit pull requests with improvements or new features.

## License
