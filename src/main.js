import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Player } from './Player.js';
import { UnderwaterEnvironment } from './Environment.js';
import { Weapon } from './Weapon.js';
import { WaterSurface } from './WaterSurface.js';
import { UnderwaterParticles } from './UnderwaterParticles.js';

class Player {
    constructor(camera) {
        this.camera = camera;
        this.moveSpeed = 0.1;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = true;

        // Initialize player position
        this.camera.position.set(0, 2, 5);
        
        // Setup mouse look controls
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.mouseSensitivity = 0.002;
        
        // Bind event handlers
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        
        // Add event listeners
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        document.addEventListener('mousemove', this.onMouseMove);
        
        // Lock pointer on click
        document.addEventListener('click', () => {
            document.body.requestPointerLock();
        });
    }

    onMouseMove(event) {
        if (document.pointerLockElement === document.body) {
            this.euler.setFromQuaternion(this.camera.quaternion);
            
            this.euler.y -= event.movementX * this.mouseSensitivity;
            this.euler.x -= event.movementY * this.mouseSensitivity;
            
            // Limit vertical rotation
            this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
            
            this.camera.quaternion.setFromEuler(this.euler);
        }
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }

    update() {
        if (document.pointerLockElement === document.body) {
            this.velocity.x = 0;
            this.velocity.z = 0;

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();

            if (this.moveForward || this.moveBackward) {
                this.velocity.z -= this.direction.z * this.moveSpeed;
            }
            if (this.moveLeft || this.moveRight) {
                this.velocity.x -= this.direction.x * this.moveSpeed;
            }

            // Move the camera
            this.camera.position.add(
                new THREE.Vector3(
                    -this.velocity.x * Math.cos(this.euler.y) - this.velocity.z * Math.sin(this.euler.y),
                    0,
                    -this.velocity.x * Math.sin(this.euler.y) + this.velocity.z * Math.cos(this.euler.y)
                )
            );
        }
    }
}

class UnderwaterEnvironment {
    constructor(scene) {
        this.scene = scene;
        this.setupEnvironment();
    }

    setupEnvironment() {
        // Add fog for underwater effect
        this.scene.fog = new THREE.FogExp2(0x006994, 0.05);

        // Create ocean floor
        const floorGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
        const floorMaterial = new THREE.MeshPhongMaterial({
            color: 0x156289,
            side: THREE.DoubleSide,
            wireframe: false
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = Math.PI / 2;
        floor.position.y = -10;
        this.scene.add(floor);

        // Add some random rocks
        this.addRocks();
    }

    addRocks() {
        const rockGeometry = new THREE.DodecahedronGeometry(1);
        const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });

        for (let i = 0; i < 50; i++) {
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.x = (Math.random() - 0.5) * 80;
            rock.position.y = -9;
            rock.position.z = (Math.random() - 0.5) * 80;
            rock.rotation.y = Math.random() * Math.PI;
            rock.scale.set(
                Math.random() * 2 + 0.5,
                Math.random() * 2 + 0.5,
                Math.random() * 2 + 0.5
            );
            this.scene.add(rock);
        }
    }
}

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