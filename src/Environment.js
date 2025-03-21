import * as THREE from 'three';

export class Environment {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        
        // Initialize environment components
        this.createWaterSurface();
        this.createSeafloor();
        this.createRocks();
        this.createSeaweed();
        this.createCaustics();
        this.createParticles();
        this.createDecorations();
    }
    
    createWaterSurface() {
        const geometry = new THREE.PlaneGeometry(100, 100, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.8,
            metalness: 0.5,
            roughness: 0.2,
            side: THREE.DoubleSide
        });
        this.waterSurface = new THREE.Mesh(geometry, material);
        this.waterSurface.rotation.x = -Math.PI / 2;
        this.waterSurface.position.y = 5;
        this.scene.add(this.waterSurface);
        
        // Add wave animation
        this.waterVertices = geometry.attributes.position.array;
        this.waterVerticesOriginal = [...this.waterVertices];
    }
    
    createSeafloor() {
        const geometry = new THREE.PlaneGeometry(100, 100, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0x98FF98,
            metalness: 0.1,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        this.seafloor = new THREE.Mesh(geometry, material);
        this.seafloor.rotation.x = -Math.PI / 2;
        this.seafloor.position.y = -10;
        this.scene.add(this.seafloor);
    }
    
    createRocks() {
        const rockColors = [0xFFA07A, 0xF08080, 0xE9967A];
        for (let i = 0; i < 50; i++) {
            const geometry = new THREE.SphereGeometry(
                Math.random() * 2 + 1,
                8,
                8
            );
            const material = new THREE.MeshStandardMaterial({
                color: rockColors[Math.floor(Math.random() * rockColors.length)],
                metalness: 0.1,
                roughness: 0.9
            });
            const rock = new THREE.Mesh(geometry, material);
            rock.position.set(
                Math.random() * 80 - 40,
                -9,
                Math.random() * 80 - 40
            );
            this.scene.add(rock);
        }
    }
    
    createSeaweed() {
        const seaweedColors = [0x98FB98, 0x90EE90, 0x00FA9A]; // Bright green colors
        
        for (let i = 0; i < 100; i++) {
            const points = [];
            const height = 5 + Math.random() * 10;
            const segments = 10;
            
            for (let j = 0; j < segments; j++) {
                points.push(new THREE.Vector3(
                    Math.sin(j * 0.2) * 0.5,
                    j * (height / segments),
                    Math.cos(j * 0.2) * 0.5
                ));
            }
            
            const curve = new THREE.CatmullRomCurve3(points);
            const geometry = new THREE.TubeGeometry(curve, 20, 0.2, 8, false);
            const material = new THREE.MeshStandardMaterial({
                color: seaweedColors[Math.floor(Math.random() * seaweedColors.length)],
                metalness: 0.2,
                roughness: 0.8,
                transparent: true,
                opacity: 0.9
            });
            
            const seaweed = new THREE.Mesh(geometry, material);
            seaweed.position.set(
                (Math.random() - 0.5) * 200,
                -50,
                (Math.random() - 0.5) * 200
            );
            seaweed.castShadow = true;
            this.scene.add(seaweed);
            
            // Store original points for animation
            seaweed.userData.originalPoints = points.map(p => p.clone());
            seaweed.userData.curve = curve;
        }
    }
    
    createCaustics() {
        const geometry = new THREE.PlaneGeometry(1000, 1000);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                brightness: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float brightness;
                varying vec2 vUv;
                
                void main() {
                    vec2 p = vUv * 20.0;
                    float brightness = brightness * 0.5;
                    
                    float caustic = 0.0;
                    for(float i = 0.0; i < 3.0; i++) {
                        vec2 offset = vec2(cos(time + i), sin(time + i)) * 0.02;
                        caustic += sin(p.x + time + i) * sin(p.y + time + i) * brightness;
                    }
                    
                    gl_FragColor = vec4(vec3(0.0, 0.5, 1.0) * (caustic + 0.5), 0.3);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        this.caustics = new THREE.Mesh(geometry, material);
        this.caustics.rotation.x = -Math.PI / 2;
        this.caustics.position.y = -49.9;
        this.scene.add(this.caustics);
    }
    
    createParticles() {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 200;
            positions[i3 + 1] = Math.random() * 100 - 50;
            positions[i3 + 2] = (Math.random() - 0.5) * 200;
            
            velocities[i3] = (Math.random() - 0.5) * 0.1;
            velocities[i3 + 1] = Math.random() * 0.1;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.2,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            map: this.createParticleTexture()
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createDecorations() {
        // Add coral formations
        const coralColors = [0xFF69B4, 0xFF1493, 0xFF00FF, 0xFFB6C1]; // Bright pink/purple colors
        
        for (let i = 0; i < 30; i++) {
            const geometry = new THREE.ConeGeometry(1 + Math.random(), 2 + Math.random() * 4, 5);
            const material = new THREE.MeshStandardMaterial({
                color: coralColors[Math.floor(Math.random() * coralColors.length)],
                metalness: 0.3,
                roughness: 0.7
            });
            
            const coral = new THREE.Mesh(geometry, material);
            coral.position.set(
                (Math.random() - 0.5) * 200,
                -49,
                (Math.random() - 0.5) * 200
            );
            coral.rotation.y = Math.random() * Math.PI * 2;
            coral.castShadow = true;
            coral.receiveShadow = true;
            this.scene.add(coral);
        }
        
        // Add sea shells
        const shellColors = [0xFFFACD, 0xFFE4B5, 0xFFDAB9]; // Bright shell colors
        
        for (let i = 0; i < 50; i++) {
            const geometry = new THREE.TorusGeometry(0.5 + Math.random() * 0.5, 0.2, 8, 12);
            const material = new THREE.MeshStandardMaterial({
                color: shellColors[Math.floor(Math.random() * shellColors.length)],
                metalness: 0.6,
                roughness: 0.4
            });
            
            const shell = new THREE.Mesh(geometry, material);
            shell.position.set(
                (Math.random() - 0.5) * 200,
                -49.5,
                (Math.random() - 0.5) * 200
            );
            shell.rotation.set(
                Math.PI / 2,
                Math.random() * Math.PI * 2,
                0
            );
            shell.castShadow = true;
            shell.receiveShadow = true;
            this.scene.add(shell);
        }
    }
    
    update(deltaTime) {
        // Update water surface waves
        const time = performance.now() * 0.001;
        for (let i = 0; i < this.waterVertices.length; i += 3) {
            const x = this.waterVerticesOriginal[i];
            const z = this.waterVerticesOriginal[i + 2];
            this.waterVertices[i + 1] = Math.sin(x * 0.05 + time) * Math.cos(z * 0.05 + time) * 2;
        }
        this.waterSurface.geometry.attributes.position.needsUpdate = true;
        
        // Update caustics
        this.caustics.material.uniforms.time.value = time;
        this.caustics.material.uniforms.brightness.value = 0.5 + Math.sin(time) * 0.2;
        
        // Update particles
        const positions = this.particles.geometry.attributes.position;
        const velocities = this.particles.geometry.attributes.velocity;
        
        for (let i = 0; i < positions.count; i++) {
            const i3 = i * 3;
            
            positions.array[i3] += velocities.array[i3];
            positions.array[i3 + 1] += velocities.array[i3 + 1];
            positions.array[i3 + 2] += velocities.array[i3 + 2];
            
            // Wrap particles around boundaries
            if (positions.array[i3] < -100) positions.array[i3] = 100;
            if (positions.array[i3] > 100) positions.array[i3] = -100;
            if (positions.array[i3 + 1] < -50) positions.array[i3 + 1] = 50;
            if (positions.array[i3 + 1] > 50) positions.array[i3 + 1] = -50;
            if (positions.array[i3 + 2] < -100) positions.array[i3 + 2] = 100;
            if (positions.array[i3 + 2] > 100) positions.array[i3 + 2] = -100;
        }
        
        positions.needsUpdate = true;
        
        // Animate seaweed
        this.scene.traverse((object) => {
            if (object.userData.originalPoints) {
                const points = object.userData.originalPoints;
                for (let i = 1; i < points.length; i++) {
                    const point = points[i];
                    const wave = Math.sin(time * 2 + i * 0.5) * 0.2;
                    point.x = object.userData.originalPoints[i].x + wave;
                    point.z = object.userData.originalPoints[i].z + wave;
                }
                object.userData.curve.points = points;
                object.geometry.dispose();
                object.geometry = new THREE.TubeGeometry(
                    object.userData.curve,
                    20,
                    0.2,
                    8,
                    false
                );
            }
        });
    }
} 