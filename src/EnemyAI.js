import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { HealthBar } from './HealthBar.js';

export class EnemyAI {
    constructor(scene, physics, player) {
        this.scene = scene;
        this.physics = physics;
        this.player = player;
        this.enemies = [];
        this.enemyData = new Map(); // Store additional data for each enemy
        
        // Enemy settings
        this.enemyHealth = 100;
        this.enemySpeed = 15;
        this.detectionRange = 40;
        this.shootingRange = 20;
        this.shootingCooldown = 2000;
        
        // Path finding settings
        this.pathUpdateInterval = 1000; // Update path every second
        this.obstacleLayer = new THREE.Raycaster();
        this.obstacleRange = 5;
        
        // Create enemy geometry and material
        this.enemyGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        this.enemyMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.2
        });
    }

    createEnemy(position) {
        // Create enemy mesh
        const mesh = new THREE.Mesh(this.enemyGeometry, this.enemyMaterial);
        mesh.position.copy(position);
        this.scene.add(mesh);
        
        // Create physics body
        const body = this.physics.createEnemyBody(
            position,
            0.5, // radius
            1 // height
        );
        
        // Store reference to mesh in physics body
        body.userData = { mesh };
        
        // Create enemy object
        const enemy = {
            mesh,
            body,
            health: this.enemyHealth,
            lastShotTime: 0,
            state: 'idle', // idle, chasing, attacking
            targetPosition: new THREE.Vector3()
        };
        
        this.enemies.push(enemy);
        
        // Create health bar
        const healthBar = new HealthBar(this.scene, 100);
        
        // Store enemy data
        this.enemyData.set(mesh, {
            body: body,
            state: 'patrol',
            patrolPoint: new THREE.Vector3(position.x, position.y, position.z),
            lastShot: 0,
            health: 100,
            healthBar: healthBar,
            lastPathUpdate: 0,
            currentPath: [],
            pathIndex: 0
        });
        
        return enemy;
    }

    updateEnemy(enemy, deltaTime) {
        const data = this.enemyData.get(enemy.mesh);
        const distanceToPlayer = enemy.body.position.distanceTo(this.player.getPosition());
        
        // Update path finding
        const now = performance.now();
        if (now - data.lastPathUpdate > this.pathUpdateInterval) {
            this.updatePath(enemy, data);
            data.lastPathUpdate = now;
        }
        
        // Update enemy state based on distance to player and obstacles
        if (distanceToPlayer < this.shootingRange) {
            enemy.state = 'attacking';
        } else if (distanceToPlayer < this.detectionRange) {
            enemy.state = 'chasing';
        } else {
            enemy.state = 'patrol';
        }
        
        // Handle enemy behavior based on state
        switch (enemy.state) {
            case 'patrol':
                this.handlePatrol(enemy, data, deltaTime);
                break;
            case 'chase':
                this.handleChase(enemy, data, deltaTime);
                break;
            case 'attack':
                this.handleAttack(enemy, data, deltaTime);
                break;
        }
        
        // Update visual mesh position and rotation
        enemy.mesh.position.copy(enemy.body.position);
        enemy.mesh.quaternion.copy(enemy.body.quaternion);
        
        // Update health bar
        data.healthBar.update(enemy.mesh.position, this.scene.camera);
    }

    hasLineOfSight(enemy, targetPosition) {
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, enemy.body.position)
            .normalize();
        
        this.obstacleLayer.set(enemy.body.position, direction);
        const intersects = this.obstacleLayer.intersectObjects(this.scene.children, true);
        
        return intersects.length === 0 || intersects[0].distance > this.obstacleRange;
    }

    updatePath(enemy, data) {
        // Simple path finding - create waypoints around obstacles
        const toPlayer = new THREE.Vector3().subVectors(this.player.getPosition(), enemy.body.position);
        const distance = toPlayer.length();
        
        if (this.hasLineOfSight(enemy, this.player.getPosition())) {
            data.currentPath = [this.player.getPosition()];
        } else {
            // Create intermediate waypoints
            const numPoints = 3;
            const waypoints = [];
            for (let i = 0; i < numPoints; i++) {
                const t = (i + 1) / (numPoints + 1);
                const point = new THREE.Vector3()
                    .copy(enemy.body.position)
                    .lerp(this.player.getPosition(), t);
                
                // Add some randomness to avoid obstacles
                point.x += (Math.random() - 0.5) * 5;
                point.z += (Math.random() - 0.5) * 5;
                waypoints.push(point);
            }
            data.currentPath = waypoints;
        }
        data.pathIndex = 0;
    }

    handlePatrol(enemy, data, deltaTime) {
        // Simple patrol behavior - move in a circle around spawn point
        const time = performance.now() * 0.001;
        const radius = 5;
        const targetX = data.patrolPoint.x + Math.cos(time) * radius;
        const targetZ = data.patrolPoint.z + Math.sin(time) * radius;
        
        const target = new THREE.Vector3(targetX, data.patrolPoint.y, targetZ);
        this.moveTowards(enemy, data, target, 0.5);
    }

    handleChase(enemy, data, deltaTime) {
        // Follow path to player
        if (data.currentPath.length > 0) {
            const currentTarget = data.currentPath[data.pathIndex];
            const distanceToTarget = enemy.body.position.distanceTo(currentTarget);
            
            if (distanceToTarget < 2) {
                data.pathIndex = (data.pathIndex + 1) % data.currentPath.length;
            }
            
            this.moveTowards(enemy, data, currentTarget, 1.0);
        }
    }

    handleAttack(enemy, data, deltaTime) {
        // Attack player and maintain some distance
        const now = performance.now();
        if (now - data.lastShot > this.shootingCooldown) {
            this.shootAtPlayer(enemy, data);
            data.lastShot = now;
        }
        
        // Keep some distance while attacking
        const toPlayer = new THREE.Vector3().subVectors(this.player.getPosition(), enemy.body.position);
        const idealDistance = this.shootingRange * 0.7;
        const currentDistance = toPlayer.length();
        
        if (currentDistance < idealDistance) {
            // Move away from player
            toPlayer.multiplyScalar(-1);
        }
        
        this.moveTowards(enemy, data, enemy.body.position.clone().add(toPlayer), 0.7);
    }

    moveTowards(enemy, data, target, speedMultiplier) {
        // Calculate desired velocity
        const toTarget = new THREE.Vector3().subVectors(target, enemy.body.position);
        toTarget.normalize();
        toTarget.multiplyScalar(this.enemySpeed * speedMultiplier);
        
        // Apply force to move towards target
        const force = new CANNON.Vec3(toTarget.x, toTarget.y, toTarget.z);
        force.scale(this.enemySpeed);
        enemy.body.applyForce(force, enemy.body.position);
        
        // Rotate towards movement direction
        const currentDir = new THREE.Vector3(0, 0, 1).applyQuaternion(enemy.body.quaternion);
        const targetDir = toTarget.normalize();
        const rotationAxis = new THREE.Vector3().crossVectors(currentDir, targetDir);
        
        if (rotationAxis.lengthSq() > 0.001) {
            rotationAxis.normalize();
            const rotationAngle = currentDir.angleTo(targetDir);
            const rotation = new CANNON.Vec3(
                rotationAxis.x * rotationAngle * 0.05,
                rotationAxis.y * rotationAngle * 0.05,
                rotationAxis.z * rotationAngle * 0.05
            );
            enemy.body.angularVelocity.copy(rotation);
        }
    }

    shootAtPlayer(enemy, data) {
        // Calculate direction to player with some randomness for difficulty
        const toPlayer = new THREE.Vector3().subVectors(this.player.getPosition(), enemy.body.position);
        const spread = 0.1; // Accuracy spread
        toPlayer.x += (Math.random() - 0.5) * spread;
        toPlayer.y += (Math.random() - 0.5) * spread;
        toPlayer.z += (Math.random() - 0.5) * spread;
        toPlayer.normalize();
        
        // Create projectile
        const projectileSpeed = 40;
        const velocity = toPlayer.multiplyScalar(projectileSpeed);
        
        // Delegate projectile creation to weapon system
        if (this.onEnemyShoot) {
            this.onEnemyShoot(enemy.body.position, velocity);
        }
    }

    handleEnemyHit(enemy, damage) {
        const data = this.enemyData.get(enemy.mesh);
        data.health -= damage;
        data.healthBar.setHealth(data.health);
        
        // Update enemy material to show damage
        enemy.mesh.material.emissiveIntensity = 0.8;
        setTimeout(() => {
            enemy.mesh.material.emissiveIntensity = 0.2;
        }, 100);
        
        if (data.health <= 0) {
            this.destroyEnemy(enemy);
        }
    }

    destroyEnemy(enemy) {
        const data = this.enemyData.get(enemy.mesh);
        this.physics.removeBody(enemy.body);
        this.scene.remove(enemy.mesh);
        data.healthBar.remove();
        this.enemies.splice(this.enemies.indexOf(enemy), 1);
        this.enemyData.delete(enemy.mesh);
    }

    update(deltaTime) {
        const playerPosition = this.player.getPosition();
        const now = Date.now();
        
        this.enemies.forEach(enemy => {
            this.updateEnemy(enemy, deltaTime);
        });
    }
} 