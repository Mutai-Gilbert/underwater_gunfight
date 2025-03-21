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
        try {
            this.initialize();
        } catch (error) {
            this.showError(`Failed to initialize game. Error: ${error.message}`);
            console.error('Game initialization error:', error);
        }
    }

    initialize() {
        this.initializeRenderer();
        this.initializeScene();
        this.initializeCamera();
        this.initializePhysics();
        this.initializeEnvironment();
        this.initializePlayers();
        this.initializeUI();
        this.setupEventListeners();
        
        // Start game loop
        this.lastTime = performance.now();
        this.animate();
    }
    
    initializeRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Bright sky blue color
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    initializeScene() {
        this.scene = new THREE.Scene();
        
        // Add underwater fog effect with a brighter, more vibrant color
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.015);
        
        // Add ambient light with warmer color
        const ambientLight = new THREE.AmbientLight(0xFFE4B5, 0.6);
        this.scene.add(ambientLight);
        
        // Add directional light with shadows
        const directionalLight = new THREE.DirectionalLight(0xFFFAF0, 0.8);
        directionalLight.position.set(100, 100, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Add caustics effect with brighter color
        this.causticsLight = new THREE.PointLight(0x00FFFF, 0.7);
        this.causticsLight.position.set(0, 50, 0);
        this.scene.add(this.causticsLight);
        
        // Add secondary lights for atmosphere
        const blueLight = new THREE.PointLight(0x00BFFF, 0.4);
        blueLight.position.set(-50, 30, -50);
        this.scene.add(blueLight);
        
        const greenLight = new THREE.PointLight(0x98FF98, 0.4);
        greenLight.position.set(50, 30, 50);
        this.scene.add(greenLight);
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
        try {
            // Create base physics engine instance
            this.basePhysics = new Physics();
            
            // Create advanced physics with base physics instance
            this.advancedPhysics = new AdvancedPhysics(this.scene, this.basePhysics);
            
            // Store both physics instances
            this.physics = this.basePhysics; // Use base physics as default
            
            // Verify physics world is initialized
            if (!this.physics.world) {
                throw new Error('Physics world not initialized');
            }
        } catch (error) {
            throw new Error(`Failed to initialize physics: ${error.message}`);
        }
    }
    
    initializeEnvironment() {
        this.environment = new Environment(this.scene, this.physics);
        this.waterSurface = new WaterSurface(this.scene);
        this.particles = new UnderwaterParticles(this.scene);
    }
    
    initializePlayers() {
        try {
            // Create player 1
            const player1 = new Player(this.scene, this.physics, {
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
            const player2 = new Player(this.scene, this.physics, {
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

            this.players = [player1, player2];
            
            // Create weapons with the correct physics instance
            const weapon1 = new Weapon(this.scene, this.physics);
            const weapon2 = new Weapon(this.scene, this.physics);
            
            player1.setWeapon(weapon1);
            player2.setWeapon(weapon2);
            
            // Initialize weapon system
            this.weaponSystem = new WeaponSystem(this.scene, [weapon1, weapon2]);
        } catch (error) {
            throw new Error(`Failed to initialize players: ${error.message}`);
        }
    }
    
    initializeUI() {
        this.ui = new UI(this.scene);
        
        // Update player stats
        this.updatePlayerStats();
        
        // Show welcome notification
        this.ui.showNotification('Welcome to Underwater Gunfight!', 5000);
    }
    
    updatePlayerStats() {
        // Update player 1 stats
        this.ui.updatePlayerStats(0, 
            this.players[0].health,
            `${this.players[0].weapon.currentAmmo}/${this.players[0].weapon.maxAmmo}`,
            this.players[0].score
        );
        
        // Update player 2 stats
        this.ui.updatePlayerStats(1,
            this.players[1].health,
            `${this.players[1].weapon.currentAmmo}/${this.players[1].weapon.maxAmmo}`,
            this.players[1].score
        );
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
        this.players.forEach(player => player.update(deltaTime));
        
        // Update environment
        this.environment.update(deltaTime);
        this.waterSurface.update(deltaTime);
        this.particles.update(deltaTime);
        
        // Update weapon system
        this.weaponSystem.update(deltaTime);
        
        // Update UI
        this.updatePlayerStats();
        
        // Update caustics effect with smoother animation
        const time = performance.now() * 0.001;
        this.causticsLight.position.x = Math.sin(time * 0.5) * 10;
        this.causticsLight.position.z = Math.cos(time * 0.5) * 10;
        this.causticsLight.intensity = 0.5 + Math.sin(time * 2) * 0.2;
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

    showError(message) {
        const errorScreen = document.createElement('div');
        errorScreen.id = 'error-screen';
        errorScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            color: #ff0000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-family: Arial, sans-serif;
            z-index: 1000;
        `;

        const errorMessage = document.createElement('h1');
        errorMessage.textContent = 'Error';
        errorMessage.style.marginBottom = '20px';

        const errorDetails = document.createElement('p');
        errorDetails.textContent = message;
        errorDetails.style.marginBottom = '20px';

        const reloadButton = document.createElement('button');
        reloadButton.textContent = 'Reload Game';
        reloadButton.style.cssText = `
            padding: 10px 20px;
            font-size: 16px;
            background: #ff0000;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
        reloadButton.onclick = () => window.location.reload();

        errorScreen.appendChild(errorMessage);
        errorScreen.appendChild(errorDetails);
        errorScreen.appendChild(reloadButton);
        document.body.appendChild(errorScreen);
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }
}

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new UnderwaterGunfight();
    } catch (error) {
        console.error('Failed to start game:', error);
    }
}); 