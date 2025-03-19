import * as THREE from 'three';

export class Weapon {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.bullets = [];
        this.bulletSpeed = 1.5;
        this.lastShootTime = 0;
        this.shootingDelay = 250; // milliseconds between shots
        
        // Create weapon mesh (temporary cube as placeholder)
        this.createWeaponMesh();
        
        // Setup raycaster
        this.raycaster = new THREE.Raycaster();
        
        // Bind methods
        this.shoot = this.shoot.bind(this);
        this.update = this.update.bind(this);
        
        // Add event listener for shooting
        document.addEventListener('mousedown', this.shoot);
        
        // Load sound
        this.loadSound();
    }
    
    createWeaponMesh() {
        // Temporary weapon mesh (will be replaced with actual model)
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.3);
        const material = new THREE.MeshPhongMaterial({ color: 0x333333 });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position the weapon relative to the camera
        this.mesh.position.set(0.3, -0.2, -0.5);
        this.camera.add(this.mesh);
    }
    
    loadSound() {
        // Create an audio listener and add it to the camera
        const listener = new THREE.AudioListener();
        this.camera.add(listener);
        
        // Create a global audio source
        this.sound = new THREE.Audio(listener);
        
        // Load a sound and set it as the Audio object's buffer
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('/sounds/shoot.mp3', (buffer) => {
            this.sound.setBuffer(buffer);
            this.sound.setVolume(0.5);
        });
    }
    
    createBullet(direction) {
        const geometry = new THREE.SphereGeometry(0.05);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        const bullet = new THREE.Mesh(geometry, material);
        
        // Set initial position at gun barrel
        const weaponPosition = new THREE.Vector3();
        this.mesh.getWorldPosition(weaponPosition);
        bullet.position.copy(weaponPosition);
        
        // Store direction and creation time
        bullet.direction = direction;
        bullet.creationTime = Date.now();
        
        this.scene.add(bullet);
        this.bullets.push(bullet);
        
        // Create muzzle flash particle effect
        this.createMuzzleFlash(weaponPosition);
    }
    
    createMuzzleFlash(position) {
        // Create a simple particle system for muzzle flash
        const particles = new THREE.Points(
            new THREE.BufferGeometry(),
            new THREE.PointsMaterial({
                color: 0xffff00,
                size: 0.1,
                blending: THREE.AdditiveBlending,
                transparent: true
            })
        );
        
        // Create random particles in a cone shape
        const particleCount = 20;
        const positions = new Float32Array(particleCount * 3);
        
        for(let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = position.x + (Math.random() - 0.5) * 0.2;
            positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.2;
            positions[i3 + 2] = position.z + Math.random() * -0.5;
        }
        
        particles.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.scene.add(particles);
        
        // Remove particles after animation
        setTimeout(() => {
            this.scene.remove(particles);
        }, 100);
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastShootTime < this.shootingDelay) return;
        this.lastShootTime = now;
        
        // Get shooting direction from camera
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        // Create and shoot bullet
        this.createBullet(direction);
        
        // Play sound
        if (this.sound && this.sound.isPlaying) {
            this.sound.stop();
        }
        if (this.sound) {
            this.sound.play();
        }
        
        // Perform raycasting
        this.raycaster.set(this.camera.position, direction);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            // TODO: Handle hit effects
            console.log('Hit object at distance:', hit.distance);
        }
    }
    
    update() {
        // Update bullet positions
        const now = Date.now();
        this.bullets = this.bullets.filter(bullet => {
            // Move bullet
            bullet.position.add(bullet.direction.multiplyScalar(this.bulletSpeed));
            
            // Remove bullets after 2 seconds
            if (now - bullet.creationTime > 2000) {
                this.scene.remove(bullet);
                return false;
            }
            return true;
        });
    }
} 