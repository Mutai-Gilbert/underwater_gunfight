import * as THREE from 'three';

export class WaterSurface {
    constructor(scene) {
        this.scene = scene;
        
        // Create water surface
        this.createWaterSurface();
    }

    createWaterSurface() {
        // Create water geometry
        const geometry = new THREE.PlaneGeometry(200, 200, 128, 128);
        
        // Create water material with custom shader
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                distortionScale: { value: 20.0 },
                alpha: { value: 0.8 },
                sunDirection: { value: new THREE.Vector3(0.70707, 0.70707, 0) },
                waterColor: { value: new THREE.Color(0x0077be) },
                sunColor: { value: new THREE.Color(0xffffff) }
            },
            vertexShader: `
                uniform float time;
                uniform float distortionScale;
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    // Calculate wave displacement
                    float wave1 = sin(position.x * 0.05 + time * 0.7) * 
                                cos(position.z * 0.05 + time * 0.3) * 0.5;
                    float wave2 = sin(position.x * 0.02 - time * 0.4) * 
                                cos(position.z * 0.02 + time * 0.4) * 1.0;
                    float displacement = wave1 + wave2;
                    
                    // Apply displacement to position
                    vec3 newPosition = position;
                    newPosition.y += displacement;
                    
                    // Calculate normal
                    vec3 tangent = normalize(vec3(1.0, 
                        (wave1 + wave2) - (wave1 + wave2), 0.0));
                    vec3 bitangent = normalize(vec3(0.0, 
                        (wave1 + wave2) - (wave1 + wave2), 1.0));
                    vNormal = normalize(cross(tangent, bitangent));
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float alpha;
                uniform vec3 waterColor;
                uniform vec3 sunColor;
                uniform vec3 sunDirection;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    // Calculate fresnel effect
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
                    
                    // Calculate sun reflection
                    vec3 reflectionDirection = reflect(-sunDirection, vNormal);
                    float sunReflection = pow(max(0.0, dot(viewDirection, reflectionDirection)), 32.0);
                    
                    // Add water caustics
                    float caustics = 0.5 + 0.5 * sin(vUv.x * 20.0 + time) * 
                                   sin(vUv.y * 20.0 + time * 0.5);
                    
                    // Combine colors
                    vec3 color = waterColor;
                    color += sunColor * sunReflection * 0.5;
                    color *= 0.8 + 0.2 * caustics;
                    color += vec3(0.1, 0.2, 0.3) * fresnel;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create water mesh
        this.waterMesh = new THREE.Mesh(geometry, material);
        this.waterMesh.rotation.x = -Math.PI / 2;
        this.waterMesh.position.y = 0;
        
        // Add to scene
        this.scene.add(this.waterMesh);
        
        // Create water surface effects
        this.createSurfaceEffects();
    }

    createSurfaceEffects() {
        // Create ripple geometry
        const rippleGeometry = new THREE.CircleGeometry(1, 32);
        const rippleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                radius: { value: 0 },
                center: { value: new THREE.Vector2() }
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
                uniform float radius;
                uniform vec2 center;
                varying vec2 vUv;
                
                void main() {
                    float dist = distance(vUv, center);
                    float ripple = sin(dist * 50.0 - time * 5.0) * 0.5 + 0.5;
                    float alpha = smoothstep(radius, radius - 0.1, dist) * 
                                smoothstep(0.0, radius - 0.1, dist) *
                                ripple * (1.0 - dist / radius);
                    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.5);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Create ripple pool
        this.ripples = [];
        for (let i = 0; i < 10; i++) {
            const ripple = {
                mesh: new THREE.Mesh(rippleGeometry, rippleMaterial.clone()),
                active: false,
                startTime: 0
            };
            ripple.mesh.rotation.x = -Math.PI / 2;
            ripple.mesh.visible = false;
            this.scene.add(ripple.mesh);
            this.ripples.push(ripple);
        }
    }

    createRipple(position) {
        // Find inactive ripple
        const ripple = this.ripples.find(r => !r.active);
        if (!ripple) return;
        
        // Activate ripple
        ripple.active = true;
        ripple.startTime = Date.now();
        ripple.mesh.position.copy(position);
        ripple.mesh.position.y = 0;
        ripple.mesh.visible = true;
        ripple.mesh.material.uniforms.center.value.set(0.5, 0.5);
        ripple.mesh.material.uniforms.radius.value = 0;
        ripple.mesh.scale.set(0.1, 0.1, 0.1);
    }

    update(deltaTime) {
        // Update water surface
        if (this.waterMesh.material.uniforms) {
            this.waterMesh.material.uniforms.time.value += deltaTime;
        }
        
        // Update ripples
        const now = Date.now();
        this.ripples.forEach(ripple => {
            if (ripple.active) {
                const age = (now - ripple.startTime) / 1000;
                const lifespan = 2; // seconds
                
                if (age > lifespan) {
                    // Deactivate ripple
                    ripple.active = false;
                    ripple.mesh.visible = false;
                } else {
                    // Update ripple
                    const progress = age / lifespan;
                    const scale = 2 + progress * 3;
                    ripple.mesh.scale.set(scale, scale, scale);
                    ripple.mesh.material.uniforms.time.value = age;
                    ripple.mesh.material.uniforms.radius.value = 0.5;
                    ripple.mesh.material.opacity = 1 - progress;
                }
            }
        });
    }
} 