import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Player } from './Player.js';
import { UnderwaterEnvironment } from './Environment.js';
import { Weapon } from './Weapon.js';
import { WaterSurface } from './WaterSurface.js';
import { UnderwaterParticles } from './UnderwaterParticles.js';

class UnderwaterGunfight {
    constructor() {
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x006994); // Ocean blue color
        document.body.appendChild(this.renderer.domElement);

        // Clock for time-based animations
        this.clock = new THREE.Clock();

        // Initialize components
        this.player = new Player(this.camera);
        this.environment = new UnderwaterEnvironment(this.scene);
        this.weapon = new Weapon(this.scene, this.camera);
        this.waterSurface = new WaterSurface(this.scene);
        this.particles = new UnderwaterParticles(this.scene);
        
        // Lighting setup
        this.setupLights();

        // Load 3D models
        this.loadModels();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Start the animation loop
        this.animate();
    }

    setupLights() {
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0x6688cc, 0.5);
        this.scene.add(ambientLight);

        // Directional light for sun-like effect
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(-1, 1, -1);
        this.scene.add(directionalLight);

        // Add point lights for additional atmosphere
        const pointLight1 = new THREE.PointLight(0x0077ff, 50, 50);
        pointLight1.position.set(10, 5, 10);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x0077ff, 50, 50);
        pointLight2.position.set(-10, 5, -10);
        this.scene.add(pointLight2);
    }

    loadModels() {
        const loader = new GLTFLoader();
        
        // TODO: Add model loading when models are available
        // loader.load('/models/submarine.glb', (gltf) => {
        //     const model = gltf.scene;
        //     model.position.set(0, 0, -5);
        //     model.scale.set(0.5, 0.5, 0.5);
        //     this.scene.add(model);
        // });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const elapsedTime = this.clock.getElapsedTime();

        // Update components
        this.player.update();
        this.weapon.update();
        this.waterSurface.update(elapsedTime);
        this.particles.update();

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game
const game = new UnderwaterGunfight(); 