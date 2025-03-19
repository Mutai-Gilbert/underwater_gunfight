import * as THREE from 'three';

export class Player {
    constructor(camera) {
        this.camera = camera;
        this.moveSpeed = 0.1;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = true;

        // Initialize player position
        this.camera.position.set(0, 2, 5);
        
        // Setup mouse look controls
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.mouseSensitivity = 0.002;
        
        // Bind event handlers
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        
        // Add event listeners
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        document.addEventListener('mousemove', this.onMouseMove);
        
        // Lock pointer on click
        document.addEventListener('click', () => {
            document.body.requestPointerLock();
        });
    }

    onMouseMove(event) {
        if (document.pointerLockElement === document.body) {
            this.euler.setFromQuaternion(this.camera.quaternion);
            
            this.euler.y -= event.movementX * this.mouseSensitivity;
            this.euler.x -= event.movementY * this.mouseSensitivity;
            
            // Limit vertical rotation
            this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
            
            this.camera.quaternion.setFromEuler(this.euler);
        }
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }

    update() {
        if (document.pointerLockElement === document.body) {
            this.velocity.x = 0;
            this.velocity.z = 0;

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();

            if (this.moveForward || this.moveBackward) {
                this.velocity.z -= this.direction.z * this.moveSpeed;
            }
            if (this.moveLeft || this.moveRight) {
                this.velocity.x -= this.direction.x * this.moveSpeed;
            }

            // Move the camera
            this.camera.position.add(
                new THREE.Vector3(
                    -this.velocity.x * Math.cos(this.euler.y) - this.velocity.z * Math.sin(this.euler.y),
                    0,
                    -this.velocity.x * Math.sin(this.euler.y) + this.velocity.z * Math.cos(this.euler.y)
                )
            );
        }
    }
} 