import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { HealthBar } from './HealthBar.js';

export class Player {
    constructor(scene, physics, options) {
        this.scene = scene;
        this.physics = physics;
        this.options = options;
        
        // Player state
        this.health = 100;
        this.score = 0;
        this.isReloading = false;
        this.isDead = false;
        this.lastShootTime = 0;
        this.shootCooldown = 0.25; // 4 shots per second
        this.moveSpeed = 10;
        this.rotationSpeed = 3;
        
        // Movement state
        this.moveDirection = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        
        // Create player mesh
        this.createPlayerMesh();
        
        // Create physics body
        this.createPhysicsBody();
        
        // Setup input handlers
        this.setupInputHandlers();
        
        // Initialize weapon
        this.weapon = null;
    }
    
    createPlayerMesh() {
        // Create player body
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: this.options.color,
            shininess: 100,
            emissive: this.options.color,
            emissiveIntensity: 0.3
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.options.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Create player model group
        this.modelGroup = new THREE.Group();
        this.modelGroup.add(this.mesh);
        
        // Add weapon mount point
        this.weaponMount = new THREE.Object3D();
        this.weaponMount.position.set(0.3, 0, -0.5);
        this.modelGroup.add(this.weaponMount);
        
        this.scene.add(this.modelGroup);
    }
    
    createPhysicsBody() {
        // Create physics body for player
        const shape = new CANNON.Sphere(0.5);
        this.body = this.physics.createPlayerBody(this.options.position);
        this.body.addShape(shape);
        
        // Add water resistance
        this.body.addEventListener('preStep', () => {
            const velocity = this.body.velocity;
            const dragCoefficient = 0.2;
            const force = new CANNON.Vec3(
                -velocity.x * dragCoefficient,
                -velocity.y * dragCoefficient,
                -velocity.z * dragCoefficient
            );
            this.body.applyForce(force, this.body.position);
        });
    }
    
    setupInputHandlers() {
        this.keys = {};
        this.mousePosition = new THREE.Vector2();
        
        // Keyboard events
        window.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            // Handle shooting
            if (event.code === this.options.controls.shoot) {
                this.shoot();
            }
        });
        
        window.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        // Mouse events for aiming
        window.addEventListener('mousemove', (event) => {
            this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }
    
    update(deltaTime) {
        if (this.isDead) return;
        
        // Handle movement
        this.handleMovement(deltaTime);
        
        // Update position and rotation
        this.modelGroup.position.copy(this.body.position);
        this.modelGroup.quaternion.copy(this.body.quaternion);
        
        // Update weapon position
        if (this.weapon) {
            this.weapon.update(deltaTime);
        }
    }
    
    handleMovement(deltaTime) {
        // Reset movement direction
        this.moveDirection.set(0, 0, 0);
        
        // Calculate movement based on input
        if (this.keys[this.options.controls.up]) this.moveDirection.z -= 1;
        if (this.keys[this.options.controls.down]) this.moveDirection.z += 1;
        if (this.keys[this.options.controls.left]) this.moveDirection.x -= 1;
        if (this.keys[this.options.controls.right]) this.moveDirection.x += 1;
        
        // Normalize movement direction
        if (this.moveDirection.lengthSq() > 0) {
            this.moveDirection.normalize();
            
            // Apply movement force
            const force = new CANNON.Vec3(
                this.moveDirection.x * this.moveSpeed,
                0,
                this.moveDirection.z * this.moveSpeed
            );
            this.body.applyForce(force, this.body.position);
        }
        
        // Apply drag to slow down when not moving
        const velocity = this.body.velocity;
        const drag = 0.95;
        this.body.velocity.set(
            velocity.x * drag,
            velocity.y * drag,
            velocity.z * drag
        );
    }
    
    shoot() {
        if (this.isDead || this.isReloading) return;
        
        const currentTime = performance.now() / 1000;
        if (currentTime - this.lastShootTime < this.shootCooldown) return;
        
        if (this.weapon && this.weapon.canShoot()) {
            const shootDirection = new THREE.Vector3(0, 0, -1);
            shootDirection.applyQuaternion(this.modelGroup.quaternion);
            
            this.weapon.shoot(this.modelGroup.position, shootDirection);
            this.lastShootTime = currentTime;
            
            // Emit shoot event for sound effects
            const shootEvent = new CustomEvent('player-shoot', {
                detail: { player: this }
            });
            window.dispatchEvent(shootEvent);
        }
    }
    
    setWeapon(weapon) {
        this.weapon = weapon;
        if (weapon) {
            weapon.attachToMount(this.weaponMount);
        }
    }
    
    takeDamage(amount) {
        if (this.isDead) return;
        
        this.health = Math.max(0, this.health - amount);
        
        // Emit damage event for UI and sound effects
        const damageEvent = new CustomEvent('player-damage', {
            detail: { player: this, amount: amount }
        });
        window.dispatchEvent(damageEvent);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.isDead = true;
        this.mesh.material.opacity = 0.5;
        this.mesh.material.transparent = true;
        
        // Emit death event
        const deathEvent = new CustomEvent('player-death', {
            detail: { player: this }
        });
        window.dispatchEvent(deathEvent);
    }
    
    addScore(points) {
        this.score += points;
        
        // Emit score event for UI update
        const scoreEvent = new CustomEvent('player-score', {
            detail: { player: this, score: this.score }
        });
        window.dispatchEvent(scoreEvent);
    }
    
    reset() {
        this.health = 100;
        this.score = 0;
        this.isDead = false;
        this.isReloading = false;
        this.mesh.material.opacity = 1;
        this.mesh.material.transparent = false;
        this.body.position.copy(this.options.position);
        this.body.velocity.set(0, 0, 0);
        if (this.weapon) {
            this.weapon.reset();
        }
    }
} 