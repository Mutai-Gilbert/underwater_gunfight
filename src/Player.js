import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { HealthBar } from './HealthBar.js';

export class Player {
    constructor(scene, physics, options) {
        this.scene = scene;
        this.physics = physics;
        this.options = {
            position: options.position || new THREE.Vector3(0, 0, 0),
            color: options.color || 0x00ff00,
            controls: options.controls || {
                up: 'KeyW',
                down: 'KeyS',
                left: 'KeyA',
                right: 'KeyD',
                shoot: 'Space'
            }
        };
        
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.maxSpeed = 10;
        this.drag = 0.95; // Underwater drag
        this.health = 100;
        this.isAlive = true;
        
        this.createPlayerMesh();
        this.setupControls();
    }
    
    createPlayerMesh() {
        // Create player body
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: this.options.color,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.options.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add bubble trail emitter
        this.bubbleTrail = new THREE.Group();
        this.mesh.add(this.bubbleTrail);
        this.bubbleTrail.position.set(0, -0.5, 0);
        
        // Create hit effect material
        this.hitEffectMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0
        });
        
        this.scene.add(this.mesh);
    }
    
    setupControls() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false
        };
        
        // Key down handler
        window.addEventListener('keydown', (event) => {
            switch (event.code) {
                case this.options.controls.up:
                    this.keys.up = true;
                    break;
                case this.options.controls.down:
                    this.keys.down = true;
                    break;
                case this.options.controls.left:
                    this.keys.left = true;
                    break;
                case this.options.controls.right:
                    this.keys.right = true;
                    break;
                case this.options.controls.shoot:
                    this.keys.shoot = true;
                    if (this.weapon) {
                        this.weapon.shoot();
                    }
                    break;
            }
        });
        
        // Key up handler
        window.addEventListener('keyup', (event) => {
            switch (event.code) {
                case this.options.controls.up:
                    this.keys.up = false;
                    break;
                case this.options.controls.down:
                    this.keys.down = false;
                    break;
                case this.options.controls.left:
                    this.keys.left = false;
                    break;
                case this.options.controls.right:
                    this.keys.right = false;
                    break;
                case this.options.controls.shoot:
                    this.keys.shoot = false;
                    break;
            }
        });
    }
    
    setWeapon(weapon) {
        this.weapon = weapon;
        weapon.setOwner(this);
    }
    
    update(deltaTime) {
        if (!this.isAlive) return;
        
        // Calculate acceleration based on input
        this.acceleration.set(0, 0, 0);
        
        if (this.keys.up) this.acceleration.z -= 1;
        if (this.keys.down) this.acceleration.z += 1;
        if (this.keys.left) this.acceleration.x -= 1;
        if (this.keys.right) this.acceleration.x += 1;
        
        // Normalize acceleration if moving diagonally
        if (this.acceleration.lengthSq() > 0) {
            this.acceleration.normalize();
            this.acceleration.multiplyScalar(20); // Acceleration strength
        }
        
        // Apply acceleration to velocity
        this.velocity.add(this.acceleration.multiplyScalar(deltaTime));
        
        // Apply drag (water resistance)
        this.velocity.multiplyScalar(this.drag);
        
        // Limit maximum speed
        if (this.velocity.lengthSq() > this.maxSpeed * this.maxSpeed) {
            this.velocity.normalize();
            this.velocity.multiplyScalar(this.maxSpeed);
        }
        
        // Update position
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Update weapon
        if (this.weapon) {
            this.weapon.update(deltaTime);
        }
        
        // Create bubble particles
        if (Math.random() < 0.1) {
            this.createBubble();
        }
        
        // Update hit effect
        if (this.mesh.material.opacity < 0.9) {
            this.mesh.material.opacity += deltaTime * 2;
            if (this.mesh.material.opacity > 0.9) {
                this.mesh.material.opacity = 0.9;
            }
        }
    }
    
    createBubble() {
        const bubble = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 8),
            new THREE.MeshPhongMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.5
            })
        );
        
        // Random position around the bubble trail emitter
        bubble.position.set(
            (Math.random() - 0.5) * 0.2,
            0,
            (Math.random() - 0.5) * 0.2
        );
        
        this.bubbleTrail.add(bubble);
        
        // Animate bubble
        const animate = () => {
            bubble.position.y += 0.05;
            bubble.position.x += (Math.random() - 0.5) * 0.02;
            bubble.position.z += (Math.random() - 0.5) * 0.02;
            bubble.material.opacity -= 0.01;
            
            if (bubble.material.opacity <= 0) {
                this.bubbleTrail.remove(bubble);
                bubble.geometry.dispose();
                bubble.material.dispose();
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        // Visual feedback
        this.mesh.material.opacity = 0.3;
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        
        return this.health;
    }
    
    die() {
        this.isAlive = false;
        this.mesh.material.opacity = 0.2;
        
        // Create explosion effect
        const particleCount = 20;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshPhongMaterial({
                    color: this.options.color,
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 5;
            particle.velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                (Math.random() - 0.5) * speed
            );
            
            particles.add(particle);
        }
        
        particles.position.copy(this.mesh.position);
        this.scene.add(particles);
        
        // Animate explosion
        const animate = () => {
            let allParticlesGone = true;
            
            particles.children.forEach(particle => {
                particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
                particle.velocity.multiplyScalar(0.95);
                particle.material.opacity -= 0.02;
                
                if (particle.material.opacity > 0) {
                    allParticlesGone = false;
                }
            });
            
            if (allParticlesGone) {
                particles.children.forEach(particle => {
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
                this.scene.remove(particles);
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    respawn() {
        this.health = 100;
        this.isAlive = true;
        this.mesh.material.opacity = 0.9;
        this.velocity.set(0, 0, 0);
        this.mesh.position.copy(this.options.position);
    }
    
    getPosition() {
        return this.mesh.position;
    }
    
    getDirection() {
        return this.velocity.clone().normalize();
    }
} 