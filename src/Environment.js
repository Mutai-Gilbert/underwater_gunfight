import * as THREE from 'three';

export class Environment {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        
        // Environment properties
        this.waterColor = new THREE.Color(0x006994);
        this.waterLevel = 0;
        this.causticIntensity = 0.5;
        
        // Create environment elements
        this.createWaterSurface();
        this.createSeafloor();
        this.createRocks();
        this.createSeaweed();
        this.createCaustics();
        this.createParticles();
    }
    
    createWaterSurface() {
        // Create water surface geometry
        const geometry = new THREE.PlaneGeometry(100, 100, 32, 32);
        
        // Create water material with custom shader
        const waterMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                waterColor: { value: this.waterColor },
                causticIntensity: { value: this.causticIntensity }
            },
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                varying float vElevation;
                
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    
                    // Add waves
                    float elevation = sin(pos.x * 0.2 + time) * 0.5 +
                                    sin(pos.z * 0.3 + time * 0.8) * 0.3;
                    pos.y += elevation;
                    vElevation = elevation;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 waterColor;
                uniform float causticIntensity;
                varying vec2 vUv;
                varying float vElevation;
                
                void main() {
                    float caustic = abs(sin(vUv.x * 10.0 + vElevation)) *
                                  abs(sin(vUv.y * 10.0 + vElevation));
                    vec3 color = waterColor + vec3(caustic * causticIntensity);
                    gl_FragColor = vec4(color, 0.8);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.waterSurface = new THREE.Mesh(geometry, waterMaterial);
        this.waterSurface.rotation.x = -Math.PI / 2;
        this.waterSurface.position.y = this.waterLevel;
        this.scene.add(this.waterSurface);
    }
    
    createSeafloor() {
        // Create seafloor geometry with displacement
        const geometry = new THREE.PlaneGeometry(100, 100, 64, 64);
        const positions = geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] = Math.random() * 2 - 1; // Random height
        }
        
        geometry.computeVertexNormals();
        
        // Create seafloor material
        const material = new THREE.MeshPhongMaterial({
            color: 0x507050,
            shininess: 0,
            displacementMap: this.createNoiseTexture(),
            displacementScale: 2
        });
        
        this.seafloor = new THREE.Mesh(geometry, material);
        this.seafloor.rotation.x = -Math.PI / 2;
        this.seafloor.position.y = -20;
        this.seafloor.receiveShadow = true;
        this.scene.add(this.seafloor);
    }
    
    createRocks() {
        const rockCount = 20;
        this.rocks = new THREE.Group();
        
        for (let i = 0; i < rockCount; i++) {
            const geometry = new THREE.DodecahedronGeometry(
                Math.random() * 2 + 1,
                1
            );
            
            // Distort vertices for more natural look
            const positions = geometry.attributes.position.array;
            for (let j = 0; j < positions.length; j += 3) {
                positions[j] *= 0.8 + Math.random() * 0.4;
                positions[j + 1] *= 0.8 + Math.random() * 0.4;
                positions[j + 2] *= 0.8 + Math.random() * 0.4;
            }
            
            geometry.computeVertexNormals();
            
            const material = new THREE.MeshPhongMaterial({
                color: 0x666666,
                shininess: 0,
                flatShading: true
            });
            
            const rock = new THREE.Mesh(geometry, material);
            rock.position.set(
                (Math.random() - 0.5) * 80,
                -19 + Math.random() * 2,
                (Math.random() - 0.5) * 80
            );
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.castShadow = true;
            rock.receiveShadow = true;
            
            this.rocks.add(rock);
        }
        
        this.scene.add(this.rocks);
    }
    
    createSeaweed() {
        const seaweedCount = 30;
        this.seaweed = new THREE.Group();
        
        for (let i = 0; i < seaweedCount; i++) {
            const segments = 8;
            const points = [];
            
            for (let j = 0; j < segments; j++) {
                points.push(new THREE.Vector3(0, j * 1.5, 0));
            }
            
            const curve = new THREE.CatmullRomCurve3(points);
            const geometry = new THREE.TubeGeometry(curve, segments * 4, 0.1, 8, false);
            
            const material = new THREE.MeshPhongMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.8,
                shininess: 100
            });
            
            const plant = new THREE.Mesh(geometry, material);
            plant.position.set(
                (Math.random() - 0.5) * 80,
                -20,
                (Math.random() - 0.5) * 80
            );
            
            // Store original positions for animation
            plant.userData.originalPoints = points.map(p => p.clone());
            plant.userData.time = Math.random() * Math.PI * 2;
            
            this.seaweed.add(plant);
        }
        
        this.scene.add(this.seaweed);
    }
    
    createCaustics() {
        const geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                intensity: { value: 0.3 }
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
                uniform float intensity;
                varying vec2 vUv;
                
                void main() {
                    vec2 p = vUv * 20.0;
                    float brightness = abs(sin(p.x + time) * sin(p.y + time));
                    gl_FragColor = vec4(vec3(brightness * intensity), 1.0);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        this.caustics = new THREE.Mesh(geometry, material);
        this.caustics.rotation.x = -Math.PI / 2;
        this.caustics.position.y = -19.9; // Slightly above seafloor
        this.scene.add(this.caustics);
    }
    
    createParticles() {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = Math.random() * 40 - 20;
            positions[i3 + 2] = (Math.random() - 0.5) * 100;
            
            velocities[i3] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 1] = Math.random() * 0.02;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.05,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    createNoiseTexture() {
        const size = 256;
        const data = new Uint8Array(size * size);
        
        for (let i = 0; i < size * size; i++) {
            data[i] = Math.random() * 255;
        }
        
        const texture = new THREE.DataTexture(
            data,
            size,
            size,
            THREE.RedFormat,
            THREE.UnsignedByteType
        );
        texture.needsUpdate = true;
        
        return texture;
    }
    
    update(deltaTime) {
        // Update water surface
        this.waterSurface.material.uniforms.time.value += deltaTime;
        
        // Update caustics
        this.caustics.material.uniforms.time.value += deltaTime;
        
        // Update seaweed
        this.seaweed.children.forEach(plant => {
            plant.userData.time += deltaTime;
            
            const points = plant.userData.originalPoints;
            const curve = new THREE.CatmullRomCurve3(points);
            
            // Apply wave motion
            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                const wave = Math.sin(plant.userData.time + i * 0.5) * 0.2 * (i / points.length);
                point.x = plant.userData.originalPoints[i].x + wave;
                point.z = plant.userData.originalPoints[i].z + wave;
            }
            
            // Update geometry
            plant.geometry.dispose();
            plant.geometry = new THREE.TubeGeometry(curve, points.length * 4, 0.1, 8, false);
        });
        
        // Update particles
        const positions = this.particles.geometry.attributes.position.array;
        const velocities = this.particles.geometry.attributes.velocity.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            // Wrap particles around boundaries
            if (positions[i] < -50) positions[i] = 50;
            if (positions[i] > 50) positions[i] = -50;
            if (positions[i + 1] < -20) positions[i + 1] = 20;
            if (positions[i + 1] > 20) positions[i + 1] = -20;
            if (positions[i + 2] < -50) positions[i + 2] = 50;
            if (positions[i + 2] > 50) positions[i + 2] = -50;
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
    }
} 