import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class Physics {
    constructor() {
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82 * 0.2, 0) // Reduced gravity for underwater effect
        });
        
        // Set world parameters for underwater simulation
        this.world.defaultContactMaterial.friction = 0.1;
        this.world.defaultContactMaterial.restitution = 0.7;
        
        // Add water resistance (drag)
        this.world.allowSleep = false;
        this.world.solver.iterations = 10;
        
        // Store bodies and their corresponding meshes
        this.bodies = new Map();
        
        // Initialize collision detection
        this.setupCollisionEvents();
    }
    
    setupCollisionEvents() {
        this.world.addEventListener('beginContact', (event) => {
            const bodyA = event.bodyA;
            const bodyB = event.bodyB;
            
            // Handle bullet collisions
            if (bodyA.isBullet || bodyB.isBullet) {
                const bullet = bodyA.isBullet ? bodyA : bodyB;
                const target = bodyA.isBullet ? bodyB : bodyA;
                
                this.handleBulletCollision(bullet, target);
            }
            
            // Handle ammo box pickup
            if ((bodyA.isPlayer && bodyB.isAmmoBox) || (bodyB.isPlayer && bodyA.isAmmoBox)) {
                const ammoBox = bodyA.isAmmoBox ? bodyA : bodyB;
                this.handleAmmoPickup(ammoBox);
            }
        });
    }
    
    createBulletBody(position, direction) {
        const radius = 0.05;
        const bulletShape = new CANNON.Sphere(radius);
        const bulletBody = new CANNON.Body({
            mass: 1,
            shape: bulletShape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            velocity: new CANNON.Vec3(
                direction.x * 20,
                direction.y * 20,
                direction.z * 20
            )
        });
        
        // Add water resistance to bullets
        bulletBody.addEventListener('preStep', () => {
            const velocity = bulletBody.velocity;
            const dragCoefficient = 0.1;
            const force = new CANNON.Vec3(
                -velocity.x * dragCoefficient,
                -velocity.y * dragCoefficient,
                -velocity.z * dragCoefficient
            );
            bulletBody.applyForce(force, bulletBody.position);
        });
        
        bulletBody.isBullet = true;
        this.world.addBody(bulletBody);
        return bulletBody;
    }
    
    createAmmoBox(position) {
        const size = 0.5;
        const boxShape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
        const boxBody = new CANNON.Body({
            mass: 5,
            shape: boxShape,
            position: new CANNON.Vec3(position.x, position.y, position.z)
        });
        
        // Add buoyancy force
        boxBody.addEventListener('preStep', () => {
            const waterLevel = 5; // Same as our water surface
            const submergedDepth = Math.max(0, waterLevel - boxBody.position.y);
            const buoyancyForce = 9.82 * submergedDepth * size * size * size;
            boxBody.applyForce(new CANNON.Vec3(0, buoyancyForce, 0), boxBody.position);
            
            // Add water resistance
            const velocity = boxBody.velocity;
            const dragCoefficient = 0.5;
            const force = new CANNON.Vec3(
                -velocity.x * dragCoefficient,
                -velocity.y * dragCoefficient,
                -velocity.z * dragCoefficient
            );
            boxBody.applyForce(force, boxBody.position);
        });
        
        boxBody.isAmmoBox = true;
        this.world.addBody(boxBody);
        return boxBody;
    }
    
    createPlayerBody(position) {
        const radius = 0.5;
        const height = 2;
        const shape = new CANNON.Cylinder(radius, radius, height, 8);
        const playerBody = new CANNON.Body({
            mass: 80,
            shape: shape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            fixedRotation: true // Prevent player from rotating
        });
        
        playerBody.isPlayer = true;
        this.world.addBody(playerBody);
        return playerBody;
    }
    
    handleBulletCollision(bullet, target) {
        // Remove the bullet from the physics world
        this.world.removeBody(bullet);
        
        // Emit an event for visual effects
        if (this.onBulletCollision) {
            this.onBulletCollision(bullet, target);
        }
    }
    
    handleAmmoPickup(ammoBox) {
        // Remove the ammo box from the physics world
        this.world.removeBody(ammoBox);
        
        // Emit an event for visual effects and ammo count update
        if (this.onAmmoPickup) {
            this.onAmmoPickup(ammoBox);
        }
    }
    
    update(deltaTime) {
        // Step the physics world
        this.world.step(1/60, deltaTime, 3);
        
        // Update visual meshes to match physics bodies
        for (let [mesh, body] of this.bodies) {
            mesh.position.copy(body.position);
            mesh.quaternion.copy(body.quaternion);
        }
    }
    
    addBody(mesh, body) {
        this.bodies.set(mesh, body);
    }
    
    removeBody(mesh) {
        const body = this.bodies.get(mesh);
        if (body) {
            this.world.removeBody(body);
            this.bodies.delete(mesh);
        }
    }
} 