import * as THREE from 'three';

export class UnderwaterParticles {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.createParticleSystems();
    }

    createParticleSystems() {
        // Create bubbles
        this.createBubbles();
        
        // Create floating debris
        this.createDebris();
    }

    createBubbles() {
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // Random positions within the scene
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = Math.random() * -20;
            positions[i3 + 2] = (Math.random() - 0.5) * 100;

            // Upward velocity with some randomness
            velocities[i3] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 1] = Math.random() * 0.05 + 0.05;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.6,
            map: this.createBubbleTexture(),
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const bubbles = new THREE.Points(geometry, material);
        this.particles.push({
            mesh: bubbles,
            velocities: velocities
        });
        this.scene.add(bubbles);
    }

    createDebris() {
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = Math.random() * -20;
            positions[i3 + 2] = (Math.random() - 0.5) * 100;

            velocities[i3] = (Math.random() - 0.5) * 0.01;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x666666,
            size: 0.05,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const debris = new THREE.Points(geometry, material);
        this.particles.push({
            mesh: debris,
            velocities: velocities
        });
        this.scene.add(debris);
    }

    createBubbleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(
            32, 32, 0,
            32, 32, 32
        );
        
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,0.3)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    update() {
        this.particles.forEach(particleSystem => {
            const positions = particleSystem.mesh.geometry.attributes.position.array;
            const velocities = particleSystem.velocities;

            for (let i = 0; i < positions.length; i += 3) {
                // Update positions based on velocities
                positions[i] += velocities[i];
                positions[i + 1] += velocities[i + 1];
                positions[i + 2] += velocities[i + 2];

                // Reset particles that go too high
                if (positions[i + 1] > 5) {
                    positions[i + 1] = -20;
                    positions[i] = (Math.random() - 0.5) * 100;
                    positions[i + 2] = (Math.random() - 0.5) * 100;
                }
            }

            particleSystem.mesh.geometry.attributes.position.needsUpdate = true;
        });
    }
} 