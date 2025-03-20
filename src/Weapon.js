import * as THREE from 'three';

export class Weapon {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.owner = null;
        
        // Weapon properties
        this.fireRate = 0.5; // Shots per second
        this.lastShotTime = 0;
        this.projectileSpeed = 15;
        this.damage = 20;
        this.maxAmmo = 30;
        this.currentAmmo = this.maxAmmo;
        this.reloadTime = 2;
        this.isReloading = false;
        
        // Projectile pool
        this.projectilePool = [];
        this.activeProjectiles = [];
        
        this.createWeaponMesh();
    }
    
    createWeaponMesh() {
        // Create weapon model
        const geometry = new THREE.Group();
        
        // Barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
        const barrelMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            shininess: 100
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.x = Math.PI / 2;
        geometry.add(barrel);
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.3);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            shininess: 100
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.z = -0.2;
        geometry.add(body);
        
        this.mesh = geometry;
        this.mesh.position.set(0.3, -0.2, -0.5);
        this.mesh.castShadow = true;
    }
    
    setOwner(player) {
        this.owner = player;
        this.owner.mesh.add(this.mesh);
    }
    
    createProjectile() {
        // Check projectile pool first
        let projectile = this.projectilePool.pop();
        
        if (!projectile) {
            // Create new projectile if pool is empty
            const geometry = new THREE.SphereGeometry(0.1, 8, 8);
            const material = new THREE.MeshPhongMaterial({
                color: 0x00ffff,
                emissive: 0x00ffff,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.8
            });
            
            projectile = new THREE.Mesh(geometry, material);
            projectile.castShadow = true;
            
            // Add trail effect
            projectile.trail = new THREE.Group();
            projectile.add(projectile.trail);
        }
        
        // Reset projectile properties
        projectile.position.copy(this.owner.getPosition());
        projectile.position.y += 0.3; // Adjust to barrel height
        projectile.velocity = this.owner.getDirection().multiplyScalar(this.projectileSpeed);
        projectile.timeAlive = 0;
        projectile.maxLifetime = 3; // Seconds
        
        this.scene.add(projectile);
        this.activeProjectiles.push(projectile);
        
        // Create muzzle flash effect
        this.createMuzzleFlash(projectile.position);
        
        return projectile;
    }
    
    createMuzzleFlash(position) {
        const flash = new THREE.PointLight(0x00ffff, 1, 2);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // Animate flash
        let intensity = 1;
        const animate = () => {
            intensity *= 0.8;
            flash.intensity = intensity;
            
            if (intensity > 0.1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(flash);
            }
        };
        
        animate();
    }
    
    createBubbleTrail(projectile) {
        if (Math.random() < 0.3) { // Control bubble frequency
            const bubble = new THREE.Mesh(
                new THREE.SphereGeometry(0.03, 8, 8),
                new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.5
                })
            );
            
            bubble.position.set(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            );
            
            projectile.trail.add(bubble);
            
            // Animate bubble
            const animate = () => {
                bubble.position.y += 0.02;
                bubble.position.x += (Math.random() - 0.5) * 0.01;
                bubble.position.z += (Math.random() - 0.5) * 0.01;
                bubble.material.opacity -= 0.02;
                
                if (bubble.material.opacity <= 0) {
                    projectile.trail.remove(bubble);
                    bubble.geometry.dispose();
                    bubble.material.dispose();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        }
    }
    
    shoot() {
        const currentTime = performance.now();
        
        if (this.isReloading) return;
        
        if (this.currentAmmo <= 0) {
            this.reload();
            return;
        }
        
        if (currentTime - this.lastShotTime >= 1000 / this.fireRate) {
            this.createProjectile();
            this.currentAmmo--;
            this.lastShotTime = currentTime;
            
            // Auto-reload when empty
            if (this.currentAmmo <= 0) {
                this.reload();
            }
        }
    }
    
    reload() {
        if (this.isReloading || this.currentAmmo === this.maxAmmo) return;
        
        this.isReloading = true;
        
        setTimeout(() => {
            this.currentAmmo = this.maxAmmo;
            this.isReloading = false;
        }, this.reloadTime * 1000);
    }
    
    update(deltaTime) {
        // Update active projectiles
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.activeProjectiles[i];
            
            // Update position
            projectile.position.add(projectile.velocity.clone().multiplyScalar(deltaTime));
            
            // Create bubble trail
            this.createBubbleTrail(projectile);
            
            // Update lifetime
            projectile.timeAlive += deltaTime;
            
            // Check if projectile should be removed
            if (projectile.timeAlive >= projectile.maxLifetime) {
                this.scene.remove(projectile);
                this.activeProjectiles.splice(i, 1);
                this.projectilePool.push(projectile);
            }
        }
    }
    
    getAmmoStatus() {
        return {
            current: this.currentAmmo,
            max: this.maxAmmo,
            isReloading: this.isReloading
        };
    }
} 