import * as THREE from 'three';

export class HealthBar {
    constructor(scene, maxHealth = 100) {
        this.scene = scene;
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        
        // Create health bar container
        const geometry = new THREE.PlaneGeometry(1, 0.1);
        this.container = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.6 })
        );
        
        // Create health bar fill
        this.fill = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 })
        );
        
        // Add to scene
        this.container.add(this.fill);
        this.scene.add(this.container);
        
        // Set initial scale
        this.fill.scale.x = 1;
        
        // Always face camera
        this.container.renderOrder = 999;
        this.fill.renderOrder = 1000;
    }
    
    update(position, camera) {
        // Position above object
        this.container.position.copy(position);
        this.container.position.y += 2;
        
        // Face camera
        this.container.quaternion.copy(camera.quaternion);
        
        // Update fill scale based on health
        this.fill.scale.x = Math.max(0, this.currentHealth / this.maxHealth);
        
        // Update color based on health percentage
        const healthPercentage = this.currentHealth / this.maxHealth;
        if (healthPercentage > 0.6) {
            this.fill.material.color.setHex(0x00ff00); // Green
        } else if (healthPercentage > 0.3) {
            this.fill.material.color.setHex(0xffff00); // Yellow
        } else {
            this.fill.material.color.setHex(0xff0000); // Red
        }
    }
    
    setHealth(health) {
        this.currentHealth = Math.max(0, Math.min(health, this.maxHealth));
    }
    
    damage(amount) {
        this.setHealth(this.currentHealth - amount);
        return this.currentHealth <= 0;
    }
    
    remove() {
        this.scene.remove(this.container);
    }
} 