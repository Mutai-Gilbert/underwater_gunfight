import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Weapon {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        
        // Weapon stats
        this.damage = 20;
        this.maxAmmo = 30;
        this.currentAmmo = this.maxAmmo;
        this.reloadTime = 2;
        this.isReloading = false;
        this.bulletSpeed = 30;
        this.bulletLifetime = 3;
        
        // Create weapon mesh
        this.createWeaponMesh();
        
        // Initialize bullet pool
        this.bulletPool = [];
        this.activeBullets = [];
        this.createBulletPool(20);
        
        // Initialize effects
        this.createMuzzleFlash();
        
        // Setup bullet collision detection
        this.setupBulletCollision();
    }
    
    createWeaponMesh() {
        // Create weapon body
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.4);
        const material = new THREE.MeshPhongMaterial({
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.2
        });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Create weapon model group
        this.modelGroup = new THREE.Group();
        this.modelGroup.add(this.mesh);
        
        // Add muzzle point
        this.muzzlePoint = new THREE.Object3D();
        this.muzzlePoint.position.set(0, 0, -0.2);
        this.modelGroup.add(this.muzzlePoint);
    }
    
    createBulletPool(size) {
        for (let i = 0; i < size; i++) {
            // Create bullet mesh
            const geometry = new THREE.SphereGeometry(0.05, 8, 8);
            const material = new THREE.MeshPhongMaterial({
                color: 0x00ffff,
                emissive: 0x00ffff,
                emissiveIntensity: 0.5
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.visible = false;
            this.scene.add(mesh);
            
            // Create bullet trail
            const trailGeometry = new THREE.BufferGeometry();
            const trailMaterial = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.5
            });
            const trail = new THREE.Line(trailGeometry, trailMaterial);
            trail.visible = false;
            this.scene.add(trail);
            
            this.bulletPool.push({
                mesh: mesh,
                trail: trail,
                body: null,
                active: false,
                lifetime: 0
            });
        }
    }
    
    createMuzzleFlash() {
        const geometry = new THREE.PlaneGeometry(0.2, 0.2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        
        this.muzzleFlash = new THREE.Mesh(geometry, material);
        this.muzzlePoint.add(this.muzzleFlash);
        this.muzzleFlash.rotation.y = Math.PI / 4;
    }
    
    setupBulletCollision() {
        this.physics.world.addEventListener('beginContact', (event) => {
            const bodyA = event.bodyA;
            const bodyB = event.bodyB;
            
            // Check if either body is a bullet
            const bulletBody = bodyA.isBullet ? bodyA : (bodyB.isBullet ? bodyB : null);
            const targetBody = bodyA.isBullet ? bodyB : (bodyB.isBullet ? bodyA : null);
            
            if (bulletBody && targetBody) {
                // Find the bullet object
                const bullet = this.activeBullets.find(b => b.body === bulletBody);
                if (bullet) {
                    this.handleBulletCollision(bullet, targetBody);
                }
            }
        });
    }
    
    attachToMount(mount) {
        mount.add(this.modelGroup);
    }
    
    canShoot() {
        return this.currentAmmo > 0 && !this.isReloading;
    }
    
    shoot(position, direction) {
        if (!this.canShoot()) {
            if (this.currentAmmo === 0) {
                this.reload();
            }
            return;
        }
        
        // Get inactive bullet from pool
        const bullet = this.bulletPool.find(b => !b.active);
        if (!bullet) return;
        
        // Activate bullet
        bullet.active = true;
        bullet.lifetime = this.bulletLifetime;
        bullet.mesh.visible = true;
        bullet.trail.visible = true;
        
        // Position bullet
        bullet.mesh.position.copy(position);
        bullet.mesh.position.add(direction.multiplyScalar(0.5));
        
        // Create physics body for bullet
        bullet.body = this.physics.createBulletBody(bullet.mesh.position, direction);
        bullet.body.velocity.copy(direction.multiplyScalar(this.bulletSpeed));
        
        // Add to active bullets
        this.activeBullets.push(bullet);
        
        // Update ammo count
        this.currentAmmo--;
        
        // Show muzzle flash
        this.showMuzzleFlash();
        
        // Emit shoot event
        const shootEvent = new CustomEvent('weapon-shoot', {
            detail: { weapon: this, bullet: bullet }
        });
        window.dispatchEvent(shootEvent);
    }
    
    reload() {
        if (this.isReloading || this.currentAmmo === this.maxAmmo) return;
        
        this.isReloading = true;
        
        // Emit reload start event
        const reloadStartEvent = new CustomEvent('weapon-reload-start', {
            detail: { weapon: this }
        });
        window.dispatchEvent(reloadStartEvent);
        
        // Start reload timer
        setTimeout(() => {
            this.currentAmmo = this.maxAmmo;
            this.isReloading = false;
            
            // Emit reload complete event
            const reloadCompleteEvent = new CustomEvent('weapon-reload-complete', {
                detail: { weapon: this }
            });
            window.dispatchEvent(reloadCompleteEvent);
        }, this.reloadTime * 1000);
    }
    
    handleBulletCollision(bullet, targetBody) {
        // Check if target is a player
        if (targetBody.isPlayer) {
            const playerObject = targetBody.userData.player;
            if (playerObject) {
                playerObject.takeDamage(this.damage);
            }
        }
        
        // Create impact effect
        this.createImpactEffect(bullet.mesh.position);
        
        // Deactivate bullet
        this.deactivateBullet(bullet);
    }
    
    createImpactEffect(position) {
        // Create particle system for impact
        const particleCount = 10;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 1
                })
            );
            
            particle.position.copy(position);
            
            // Random velocity
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
            particle.velocity = velocity;
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // Animate particles
        const animate = () => {
            let allParticlesGone = true;
            
            particles.children.forEach(particle => {
                particle.position.add(particle.velocity.multiplyScalar(0.1));
                particle.material.opacity -= 0.05;
                
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
    
    showMuzzleFlash() {
        this.muzzleFlash.material.opacity = 1;
        
        // Animate muzzle flash
        const animate = () => {
            this.muzzleFlash.material.opacity -= 0.2;
            
            if (this.muzzleFlash.material.opacity > 0) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    deactivateBullet(bullet) {
        if (bullet.body) {
            this.physics.world.removeBody(bullet.body);
            bullet.body = null;
        }
        
        bullet.active = false;
        bullet.mesh.visible = false;
        bullet.trail.visible = false;
        
        const index = this.activeBullets.indexOf(bullet);
        if (index !== -1) {
            this.activeBullets.splice(index, 1);
        }
    }
    
    update(deltaTime) {
        // Update active bullets
        this.activeBullets.forEach(bullet => {
            if (bullet.body) {
                // Update bullet position
                bullet.mesh.position.copy(bullet.body.position);
                
                // Update bullet trail
                const positions = new Float32Array([
                    bullet.mesh.position.x, bullet.mesh.position.y, bullet.mesh.position.z,
                    bullet.mesh.position.x - bullet.body.velocity.x * 0.1,
                    bullet.mesh.position.y - bullet.body.velocity.y * 0.1,
                    bullet.mesh.position.z - bullet.body.velocity.z * 0.1
                ]);
                bullet.trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                
                // Update lifetime
                bullet.lifetime -= deltaTime;
                if (bullet.lifetime <= 0) {
                    this.deactivateBullet(bullet);
                }
            }
        });
    }
    
    reset() {
        this.currentAmmo = this.maxAmmo;
        this.isReloading = false;
        
        // Deactivate all bullets
        this.activeBullets.forEach(bullet => {
            this.deactivateBullet(bullet);
        });
    }
} 