import * as THREE from 'three';

export class WaterSurface {
    constructor(scene) {
        this.scene = scene;
        this.loadShaders().then(() => {
            this.createWaterSurface();
        });
    }

    async loadShaders() {
        const vertexResponse = await fetch('/shaders/water.vert');
        const fragmentResponse = await fetch('/shaders/water.frag');
        
        this.vertexShader = await vertexResponse.text();
        this.fragmentShader = await fragmentResponse.text();
    }

    createWaterSurface() {
        // Create a plane for the water surface
        const geometry = new THREE.PlaneGeometry(100, 100, 128, 128);

        // Create shader material
        const material = new THREE.ShaderMaterial({
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uDepthColor: { value: new THREE.Color(0x006994) },
                uSurfaceColor: { value: new THREE.Color(0x8eb1c7) },
                uColorOffset: { value: 0.08 },
                uColorMultiplier: { value: 5 }
            },
            transparent: true,
            side: THREE.DoubleSide
        });

        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 5; // Position above the scene
        
        this.scene.add(this.mesh);
    }

    update(time) {
        if (this.mesh) {
            this.mesh.material.uniforms.uTime.value = time;
        }
    }
} 