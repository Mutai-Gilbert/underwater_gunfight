import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class WeaponSystem {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.projectiles = [];
        this.currentWeapon = 'standard';
        this.currentAmmo = 30;
        this.totalAmmo = 90;
        this.lastShotTime = 0;
        
        this.weaponTypes = {
            standard: {
                damage: 25,
                speed: 50,
                cooldown: 250,
                projectileSize: 0.2,
                color: 0x00ff00,
                ammoUsage: 1
            },
            heavy: {
                damage: 50,
                speed: 40,
                cooldown: 1000,
                projectileSize: 0.4,
                color: 0xff0000,
                ammoUsage: 3
            },
            rapid: {
                damage: 15,
                speed: 60,
                cooldown: 100,
                projectileSize: 0.15,
                color: 0x00ffff,
                ammoUsage: 1
            }
        };

        // Create projectile geometry and material
        this.projectileGeometry = new THREE.SphereGeometry(1, 8, 8);
        this.projectileMaterials = {
            standard: new THREE.MeshPhongMaterial({
                color: this.weaponTypes.standard.color,
                emissive: this.weaponTypes.standard.color,
                emissiveIntensity: 0.5
            }),
            heavy: new THREE.MeshPhongMaterial({
                color: this.weaponTypes.heavy.color,
                emissive: this.weaponTypes.heavy.color,
                emissiveIntensity: 0.5
            }),
            rapid: new THREE.MeshPhongMaterial({
                color: this.weaponTypes.rapid.color,
                emissive: this.weaponTypes.rapid.color,
                emissiveIntensity: 0.5
            })
        };
    }

    shoot(position, direction) {
        const now = Date.now();
        const weapon = this.weaponTypes[this.currentWeapon];
        
        // Check cooldown and ammo
        if (now - this.lastShotTime < weapon.cooldown || this.currentAmmo < weapon.ammoUsage) {
            return false;
        }

        // Create projectile mesh
        const projectile = new THREE.Mesh(
            this.projectileGeometry,
            this.projectileMaterials[this.currentWeapon]
        );
        
        // Set projectile position and scale
        projectile.position.copy(position);
        projectile.scale.setScalar(weapon.projectileSize);
        
        // Add to scene and projectiles array
        this.scene.add(projectile);
        
        // Create physics body for projectile
        const body = this.physics.createProjectile(
            position,
            direction.multiplyScalar(weapon.speed),
            weapon.projectileSize,
            weapon.damage,
            false // isEnemyProjectile
        );
        
        // Store reference to mesh in physics body
        body.userData = { mesh: projectile };
        
        // Store projectile data
        this.projectiles.push({
            mesh: projectile,
            body: body,
            createdAt: now
        });

        // Update ammo and shot time
        this.currentAmmo -= weapon.ammoUsage;
        this.lastShotTime = now;
        
        // Trigger onShoot callback if defined
        if (this.onShoot) {
            this.onShoot();
        }

        return true;
    }

    createEnemyProjectile(position, velocity) {
        // Create projectile mesh
        const projectile = new THREE.Mesh(
            this.projectileGeometry,
            new THREE.MeshPhongMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.5
            })
        );
        
        projectile.position.copy(position);
        projectile.scale.setScalar(0.2);
        
        this.scene.add(projectile);
        
        // Create physics body
        const body = this.physics.createProjectile(
            position,
            velocity,
            0.2,
            15,
            true // isEnemyProjectile
        );
        
        body.userData = { mesh: projectile };
        
        this.projectiles.push({
            mesh: projectile,
            body: body,
            createdAt: Date.now()
        });
    }

    switchWeapon(type) {
        if (this.weaponTypes[type]) {
            this.currentWeapon = type;
            return true;
        }
        return false;
    }

    addAmmo(amount) {
        this.currentAmmo = Math.min(this.currentAmmo + amount, this.totalAmmo);
    }

    resetAmmo() {
        this.currentAmmo = 30;
        this.totalAmmo = 90;
    }

    clearProjectiles() {
        // Remove all projectiles from scene and physics world
        this.projectiles.forEach(projectile => {
            if (projectile.mesh && projectile.mesh.parent) {
                this.scene.remove(projectile.mesh);
            }
            if (projectile.body) {
                this.physics.removeBody(projectile.body);
            }
        });
        this.projectiles = [];
    }

    update(deltaTime) {
        const now = Date.now();
        const maxAge = 5000; // Remove projectiles after 5 seconds
        
        // Update projectiles
        this.projectiles = this.projectiles.filter(projectile => {
            // Remove old projectiles
            if (now - projectile.createdAt > maxAge) {
                if (projectile.mesh && projectile.mesh.parent) {
                    this.scene.remove(projectile.mesh);
                }
                if (projectile.body) {
                    this.physics.removeBody(projectile.body);
                }
                return false;
            }
            
            // Update mesh position to match physics body
            if (projectile.body && projectile.mesh) {
                const position = this.physics.getBodyPosition(projectile.body);
                projectile.mesh.position.copy(position);
            }
            
            return true;
        });
    }
} 