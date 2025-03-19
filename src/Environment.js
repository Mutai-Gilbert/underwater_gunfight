import * as THREE from 'three';

export class UnderwaterEnvironment {
    constructor(scene) {
        this.scene = scene;
        this.setupEnvironment();
    }

    setupEnvironment() {
        // Add fog for underwater effect
        this.scene.fog = new THREE.FogExp2(0x006994, 0.05);

        // Create ocean floor
        const floorGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
        const floorMaterial = new THREE.MeshPhongMaterial({
            color: 0x156289,
            side: THREE.DoubleSide,
            wireframe: false
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = Math.PI / 2;
        floor.position.y = -10;
        this.scene.add(floor);

        // Add some random rocks
        this.addRocks();
    }

    addRocks() {
        const rockGeometry = new THREE.DodecahedronGeometry(1);
        const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });

        for (let i = 0; i < 50; i++) {
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.x = (Math.random() - 0.5) * 80;
            rock.position.y = -9;
            rock.position.z = (Math.random() - 0.5) * 80;
            rock.rotation.y = Math.random() * Math.PI;
            rock.scale.set(
                Math.random() * 2 + 0.5,
                Math.random() * 2 + 0.5,
                Math.random() * 2 + 0.5
            );
            this.scene.add(rock);
        }
    }
} 