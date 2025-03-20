import * as THREE from 'three';
import { AdvancedPhysics } from './AdvancedPhysics.js';
import { Player } from './Player.js';
import { Weapon } from './Weapon.js';
import { Environment } from './Environment.js';
import { WeaponSystem } from './WeaponSystem.js';
import { WaterSurface } from './WaterSurface.js';
import { UnderwaterParticles } from './UnderwaterParticles.js';
import { Physics } from './Physics.js';
import { EnemyAI } from './EnemyAI.js';
import { UI } from './UI.js';

export class UnderwaterGunfight {
    constructor() {
        // Initialize core components
        this.initializeRenderer();
        this.initializeScene();
        this.initializeCamera();
        this.initializePhysics();
        this.initializeEnvironment();
        this.initializePlayers();
        
        // Start game loop
        this.lastTime = performance.now();
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    initializeRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x006994); // Ocean blue color
        this.renderer.shadowMap.enabled = true;
    }
    
    initializeScene() {
        this.scene = new THREE.Scene();
        
        // Add underwater fog effect
        this.scene.fog = new THREE.FogExp2(0x006994, 0.02);
        
        // Add ambient and directional light
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(100, 100, 100);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Add caustics effect (simulated water surface light patterns)
        this.causticsLight = new THREE.PointLight(0x00ffff, 0.5);
        this.causticsLight.position.set(0, 50, 0);
        this.scene.add(this.causticsLight);
    }
    
    initializeCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);
    }
    
    initializePhysics() {
        this.physics = new AdvancedPhysics(this.scene);
    }
    
    initializeEnvironment() {
        this.environment = new Environment(this.scene, this.physics);
    }
    
    initializePlayers() {
        // Create player 1
        this.player1 = new Player(this.scene, this.physics, {
            position: new THREE.Vector3(-5, 0, 0),
            color: 0x00ff00,
            controls: {
                up: 'KeyW',
                down: 'KeyS',
                left: 'KeyA',
                right: 'KeyD',
                shoot: 'Space'
            }
        });
        
        // Create player 2
        this.player2 = new Player(this.scene, this.physics, {
            position: new THREE.Vector3(5, 0, 0),
            color: 0xff0000,
            controls: {
                up: 'ArrowUp',
                down: 'ArrowDown',
                left: 'ArrowLeft',
                right: 'ArrowRight',
                shoot: 'Enter'
            }
        });
        
        // Give weapons to players
        this.player1.setWeapon(new Weapon(this.scene, this.physics));
        this.player2.setWeapon(new Weapon(this.scene, this.physics));
    }
    
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    update(deltaTime) {
        // Update physics
        this.physics.update(deltaTime);
        
        // Update players
        this.player1.update(deltaTime);
        this.player2.update(deltaTime);
        
        // Update environment
        this.environment.update(deltaTime);
        
        // Update caustics effect
        const time = performance.now() * 0.001;
        this.causticsLight.position.x = Math.sin(time) * 10;
        this.causticsLight.position.z = Math.cos(time) * 10;
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
    }
}

// Start the game
new UnderwaterGunfight(); 