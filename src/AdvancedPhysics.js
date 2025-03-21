import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class AdvancedPhysics {
    constructor(scene, physics) {
        if (!physics) {
            throw new Error('Physics instance must be provided to AdvancedPhysics');
        }
        this.scene = scene;
        this.physics = physics;
        this.world = physics.world;
        
        // Initialize physics properties
        this.bodies = new Map();
        this.meshes = new Map();
        
        // Set up collision detection
        this.setupCollisionDetection();
    }
    
    setupCollisionDetection() {
        this.world.addEventListener('beginContact', (event) => {
            const bodyA = event.bodyA;
            const bodyB = event.bodyB;
            
            // Handle collisions between objects
            this.handleCollision(bodyA, bodyB);
        });
    }
    
    handleCollision(bodyA, bodyB) {
        // Get the meshes associated with the bodies
        const meshA = this.meshes.get(bodyA.id);
        const meshB = this.meshes.get(bodyB.id);
        
        if (meshA && meshB) {
            // Emit collision event that can be listened to by game objects
            const event = new CustomEvent('physics-collision', {
                detail: {
                    bodyA: bodyA,
                    bodyB: bodyB,
                    meshA: meshA,
                    meshB: meshB
                }
            });
            window.dispatchEvent(event);
        }
    }
    
    addBody(mesh, options = {}) {
        const defaults = {
            mass: 1,
            type: CANNON.Body.DYNAMIC,
            shape: null,
            position: mesh.position.clone(),
            material: new CANNON.Material({ friction: 0.3, restitution: 0.3 })
        };
        
        const config = { ...defaults, ...options };
        
        // Create physics body
        const body = new CANNON.Body({
            mass: config.mass,
            type: config.type,
            shape: config.shape || this.getShapeFromGeometry(mesh.geometry),
            position: new CANNON.Vec3(config.position.x, config.position.y, config.position.z),
            material: config.material
        });
        
        // Add body to world
        this.world.addBody(body);
        
        // Store references
        this.bodies.set(mesh.id, body);
        this.meshes.set(body.id, mesh);
        
        return body;
    }
    
    removeBody(mesh) {
        const body = this.bodies.get(mesh.id);
        if (body) {
            this.world.removeBody(body);
            this.bodies.delete(mesh.id);
            this.meshes.delete(body.id);
        }
    }
    
    getShapeFromGeometry(geometry) {
        // Create appropriate CANNON shape based on THREE.js geometry
        if (geometry instanceof THREE.BoxGeometry) {
            const params = geometry.parameters;
            return new CANNON.Box(new CANNON.Vec3(
                params.width / 2,
                params.height / 2,
                params.depth / 2
            ));
        } else if (geometry instanceof THREE.SphereGeometry) {
            return new CANNON.Sphere(geometry.parameters.radius);
        } else {
            // Default to a box with geometry's bounding box dimensions
            geometry.computeBoundingBox();
            const box = geometry.boundingBox;
            const size = box.getSize(new THREE.Vector3());
            return new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        }
    }
    
    update() {
        // Update mesh positions based on physics bodies
        this.bodies.forEach((body, meshId) => {
            const mesh = this.scene.getObjectById(meshId);
            if (mesh) {
                mesh.position.copy(body.position);
                mesh.quaternion.copy(body.quaternion);
            }
        });
    }
    
    applyForce(mesh, force, worldPoint) {
        const body = this.bodies.get(mesh.id);
        if (body) {
            body.applyForce(
                new CANNON.Vec3(force.x, force.y, force.z),
                worldPoint ? new CANNON.Vec3(worldPoint.x, worldPoint.y, worldPoint.z) : body.position
            );
        }
    }
    
    setVelocity(mesh, velocity) {
        const body = this.bodies.get(mesh.id);
        if (body) {
            body.velocity.copy(velocity);
        }
    }
    
    getVelocity(mesh) {
        const body = this.bodies.get(mesh.id);
        return body ? body.velocity : null;
    }
} 