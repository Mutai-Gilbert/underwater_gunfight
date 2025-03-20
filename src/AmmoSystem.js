import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

export class AmmoSystem {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.ammoBoxes = new Set();
        this.ammoCount = 30; // Starting ammo
        
        // Load font first
        const fontLoader = new FontLoader();
        fontLoader.load('/node_modules/three/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            this.font = font;
            // Create UI elements
            this.createUI();
            
            // Setup ammo pickup callback
            this.physics.onAmmoPickup = (ammoBox) => this.handleAmmoPickup(ammoBox);
            
            // Create initial ammo boxes
            this.spawnAmmoBoxes(5);
        });
    }
    
    createUI() {
        // Create ammo counter element
        this.ammoCounter = document.createElement('div');
        this.ammoCounter.style.position = 'absolute';
        this.ammoCounter.style.bottom = '20px';
        this.ammoCounter.style.right = '20px';
        this.ammoCounter.style.color = 'white';
        this.ammoCounter.style.fontSize = '24px';
        this.ammoCounter.style.fontFamily = 'Arial, sans-serif';
        this.ammoCounter.style.textShadow = '2px 2px 2px rgba(0,0,0,0.5)';
        document.body.appendChild(this.ammoCounter);
        
        this.updateAmmoDisplay();
    }
    
    createAmmoBox(position) {
        // Create visual mesh
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            metalness: 0.7,
            roughness: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        
        // Add details to the ammo box
        this.addAmmoBoxDetails(mesh);
        
        // Create physics body
        const body = this.physics.createAmmoBox(position);
        
        // Link mesh and body
        this.physics.addBody(mesh, body);
        
        // Add to scene and tracking
        this.scene.add(mesh);
        this.ammoBoxes.add(mesh);
        
        return mesh;
    }
    
    addAmmoBoxDetails(mesh) {
        // Add edge lines for visual detail
        const edges = new THREE.EdgesGeometry(mesh.geometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x000000 })
        );
        mesh.add(line);
        
        // Add ammo symbol if font is loaded
        if (this.font) {
            const textGeometry = new TextGeometry('AMMO', {
                font: this.font,
                size: 0.1,
                height: 0.02
            });
            const textMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xFFD700,
                metalness: 0.8,
                roughness: 0.2
            });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(-0.2, 0, 0.26);
            mesh.add(textMesh);
        }
    }
    
    spawnAmmoBoxes(count) {
        for (let i = 0; i < count; i++) {
            const position = new THREE.Vector3(
                (Math.random() - 0.5) * 80,
                Math.random() * 3,
                (Math.random() - 0.5) * 80
            );
            this.createAmmoBox(position);
        }
    }
    
    handleAmmoPickup(ammoBoxBody) {
        // Find and remove the corresponding mesh
        for (const mesh of this.ammoBoxes) {
            if (this.physics.bodies.get(mesh) === ammoBoxBody) {
                this.scene.remove(mesh);
                this.physics.removeBody(mesh);
                this.ammoBoxes.delete(mesh);
                break;
            }
        }
        
        // Add ammo to player's count
        this.ammoCount += 10;
        this.updateAmmoDisplay();
        
        // Create pickup effect
        this.createPickupEffect();
        
        // Spawn a new ammo box after some time
        setTimeout(() => this.spawnAmmoBoxes(1), 5000);
    }
    
    createPickupEffect() {
        const particles = new THREE.Points(
            new THREE.BufferGeometry(),
            new THREE.PointsMaterial({
                color: 0xFFD700,
                size: 0.1,
                blending: THREE.AdditiveBlending,
                transparent: true
            })
        );
        
        // Create random particles in a sphere
        const particleCount = 20;
        const positions = new Float32Array(particleCount * 3);
        
        for(let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 0.5;
            positions[i3 + 1] = (Math.random() - 0.5) * 0.5;
            positions[i3 + 2] = (Math.random() - 0.5) * 0.5;
        }
        
        particles.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.scene.add(particles);
        
        // Animate and remove after 1 second
        setTimeout(() => this.scene.remove(particles), 1000);
    }
    
    useAmmo(count = 1) {
        if (this.ammoCount >= count) {
            this.ammoCount -= count;
            this.updateAmmoDisplay();
            return true;
        }
        return false;
    }
    
    updateAmmoDisplay() {
        this.ammoCounter.textContent = `AMMO: ${this.ammoCount}`;
    }
    
    update(deltaTime) {
        // Update ammo box animations or effects if needed
        for (const box of this.ammoBoxes) {
            box.rotation.y += deltaTime * 0.5;
        }
    }
} 