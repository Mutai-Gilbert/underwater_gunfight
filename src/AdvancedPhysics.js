import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class AdvancedPhysics {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.world = physics.world;
        
        // Store interactive objects
        this.floatingObjects = [];
        this.chains = [];
        
        // Create interactive objects
        this.createFloatingPlatforms();
        this.createChains();
    }

    createFloatingPlatforms() {
        // Create floating platforms at random positions
        for (let i = 0; i < 10; i++) {
            const position = new THREE.Vector3(
                (Math.random() - 0.5) * 60,
                Math.random() * 5 + 2,
                (Math.random() - 0.5) * 60
            );
            
            const size = new THREE.Vector3(3, 0.5, 3);
            this.createFloatingObject(position, size, 5);
        }
    }

    createFloatingObject(position, size, mass) {
        // Create visual mesh
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.7,
            metalness: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        this.scene.add(mesh);
        
        // Create physics body
        const shape = new CANNON.Box(new CANNON.Vec3(size.x/2, size.y/2, size.z/2));
        const body = new CANNON.Body({
            mass: mass,
            shape: shape,
            material: this.physics.worldMaterial,
            position: new CANNON.Vec3(position.x, position.y, position.z)
        });
        
        // Add buoyancy force
        body.addEventListener('preStep', () => {
            const waterLevel = 0;
            const volume = size.x * size.y * size.z;
            const submergedVolume = this.calculateSubmergedVolume(body, waterLevel, size);
            const buoyancyForce = 9.82 * submergedVolume;
            
            // Apply buoyancy force at center of submerged volume
            const forcePoint = this.calculateBuoyancyForcePoint(body, waterLevel, size);
            body.applyForce(new CANNON.Vec3(0, buoyancyForce, 0), forcePoint);
            
            // Add water resistance
            const velocity = body.velocity;
            const rotation = body.angularVelocity;
            const dragCoefficient = 0.5;
            const rotationalDragCoefficient = 0.2;
            
            // Linear drag
            const force = new CANNON.Vec3(
                -velocity.x * dragCoefficient * submergedVolume,
                -velocity.y * dragCoefficient * submergedVolume,
                -velocity.z * dragCoefficient * submergedVolume
            );
            body.applyForce(force, body.position);
            
            // Rotational drag
            const torque = new CANNON.Vec3(
                -rotation.x * rotationalDragCoefficient * submergedVolume,
                -rotation.y * rotationalDragCoefficient * submergedVolume,
                -rotation.z * rotationalDragCoefficient * submergedVolume
            );
            body.torque.vadd(torque, body.torque);
        });
        
        this.world.addBody(body);
        
        // Store object data
        this.floatingObjects.push({
            mesh: mesh,
            body: body,
            size: size
        });
        
        return body;
    }

    createChains() {
        // Create chains at random positions
        for (let i = 0; i < 3; i++) {
            const position = new THREE.Vector3(
                (Math.random() - 0.5) * 40,
                15,
                (Math.random() - 0.5) * 40
            );
            
            const linkSize = new THREE.Vector3(0.3, 0.6, 0.3);
            this.createChain(position, 10, linkSize, 0.5);
        }
    }

    createChain(startPosition, numLinks, linkSize, linkMass) {
        const chain = {
            links: [],
            constraints: []
        };
        
        let prevBody = null;
        
        // Create chain links
        for (let i = 0; i < numLinks; i++) {
            // Create visual mesh
            const geometry = new THREE.BoxGeometry(linkSize.x, linkSize.y, linkSize.z);
            const material = new THREE.MeshStandardMaterial({
                color: 0x444444,
                roughness: 0.7,
                metalness: 0.3
            });
            const mesh = new THREE.Mesh(geometry, material);
            this.scene.add(mesh);
            
            // Create physics body
            const shape = new CANNON.Box(new CANNON.Vec3(linkSize.x/2, linkSize.y/2, linkSize.z/2));
            const position = new CANNON.Vec3(
                startPosition.x,
                startPosition.y - i * linkSize.y,
                startPosition.z
            );
            
            const body = new CANNON.Body({
                mass: i === 0 ? 0 : linkMass, // First link is fixed
                shape: shape,
                material: this.physics.worldMaterial,
                position: position
            });
            
            // Add buoyancy and water resistance
            body.addEventListener('preStep', () => {
                const waterLevel = 0;
                const volume = linkSize.x * linkSize.y * linkSize.z;
                const submergedVolume = this.calculateSubmergedVolume(body, waterLevel, linkSize);
                const buoyancyForce = 9.82 * submergedVolume;
                
                // Apply buoyancy force
                body.applyForce(new CANNON.Vec3(0, buoyancyForce, 0), body.position);
                
                // Add water resistance
                const velocity = body.velocity;
                const rotation = body.angularVelocity;
                const dragCoefficient = 0.5;
                const rotationalDragCoefficient = 0.2;
                
                // Linear drag
                const force = new CANNON.Vec3(
                    -velocity.x * dragCoefficient * submergedVolume,
                    -velocity.y * dragCoefficient * submergedVolume,
                    -velocity.z * dragCoefficient * submergedVolume
                );
                body.applyForce(force, body.position);
                
                // Rotational drag
                const torque = new CANNON.Vec3(
                    -rotation.x * rotationalDragCoefficient * submergedVolume,
                    -rotation.y * rotationalDragCoefficient * submergedVolume,
                    -rotation.z * rotationalDragCoefficient * submergedVolume
                );
                body.torque.vadd(torque, body.torque);
            });
            
            this.world.addBody(body);
            
            // Create constraint with previous link
            if (prevBody) {
                const constraint = new CANNON.PointToPointConstraint(
                    prevBody,
                    new CANNON.Vec3(0, -linkSize.y/2, 0),
                    body,
                    new CANNON.Vec3(0, linkSize.y/2, 0)
                );
                this.world.addConstraint(constraint);
                chain.constraints.push(constraint);
            }
            
            // Store link data
            chain.links.push({
                mesh: mesh,
                body: body
            });
            
            prevBody = body;
        }
        
        this.chains.push(chain);
        return chain;
    }

    calculateSubmergedVolume(body, waterLevel, size) {
        // Calculate how much of the object is underwater
        const pos = body.position;
        const rot = body.quaternion;
        
        // Transform points to world space
        const corners = [
            new CANNON.Vec3(-size.x/2, -size.y/2, -size.z/2),
            new CANNON.Vec3(size.x/2, -size.y/2, -size.z/2),
            new CANNON.Vec3(-size.x/2, size.y/2, -size.z/2),
            new CANNON.Vec3(size.x/2, size.y/2, -size.z/2),
            new CANNON.Vec3(-size.x/2, -size.y/2, size.z/2),
            new CANNON.Vec3(size.x/2, -size.y/2, size.z/2),
            new CANNON.Vec3(-size.x/2, size.y/2, size.z/2),
            new CANNON.Vec3(size.x/2, size.y/2, size.z/2)
        ];
        
        // Count submerged corners
        let submergedCorners = 0;
        corners.forEach(corner => {
            // Transform corner to world space
            const worldCorner = new CANNON.Vec3();
            corner.copy(worldCorner);
            rot.vmult(worldCorner, worldCorner);
            worldCorner.vadd(pos, worldCorner);
            
            if (worldCorner.y < waterLevel) {
                submergedCorners++;
            }
        });
        
        // Calculate approximate submerged volume
        const totalVolume = size.x * size.y * size.z;
        return (submergedCorners / 8) * totalVolume;
    }

    calculateBuoyancyForcePoint(body, waterLevel, size) {
        // Calculate the center point of the submerged portion
        const pos = body.position;
        const submergedCenter = new CANNON.Vec3(
            pos.x,
            Math.min(pos.y, waterLevel - size.y/4),
            pos.z
        );
        return submergedCenter;
    }

    update(deltaTime) {
        // Update floating objects
        this.floatingObjects.forEach(object => {
            object.mesh.position.copy(object.body.position);
            object.mesh.quaternion.copy(object.body.quaternion);
        });
        
        // Update chains
        this.chains.forEach(chain => {
            chain.links.forEach(link => {
                link.mesh.position.copy(link.body.position);
                link.mesh.quaternion.copy(link.body.quaternion);
            });
        });
    }
} 