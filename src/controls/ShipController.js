/**
 * ShipController.js — WASD ship + OrbitControls camera + island collision
 *
 * Clean version: uses Three.js OrbitControls for completely smooth mouse panning.
 */

import * as THREE from 'three';

const ACCEL = 40;
const MAX_SPEED = 60;
const DRAG = 0.98;
const TURN_SPEED = 1.6;

// Island collision
const ISLAND_POS = new THREE.Vector3(180, 10, -80);
const ISLAND_RADIUS = 45;

export class ShipController {
    constructor(ship, camera, controls) {
        this.ship = ship;
        this.camera = camera;
        this.controls = controls;

        this.velocity = 0;
        this.heading = 0;
        this.speed = 0;
        this._lastTime = null;

        this.keys = { forward: false, backward: false, left: false, right: false };

        // HMR safety
        if (window.__shipCtrlCleanup) window.__shipCtrlCleanup();

        this._boundDown = (e) => this._onKey(e, true);
        this._boundUp = (e) => this._onKey(e, false);

        window.addEventListener('keydown', this._boundDown);
        window.addEventListener('keyup', this._boundUp);

        window.__shipCtrlCleanup = () => this.dispose();

        // Initial setup for OrbitControls
        this.controls.target.copy(this.ship.position);
        this.controls.update();

        // Initial camera position relative to ship
        this.camera.position.set(
            this.ship.position.x,
            this.ship.position.y + 15,
            this.ship.position.z + 35
        );
    }

    _onKey(e, pressed) {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': this.keys.backward = pressed; break;
            case 'KeyS': case 'ArrowDown': this.keys.forward = pressed; break;
            case 'KeyA': case 'ArrowLeft': this.keys.left = pressed; break;
            case 'KeyD': case 'ArrowRight': this.keys.right = pressed; break;
            default: return;
        }
        // e.preventDefault();
    }

    tick(elapsed) {
        const delta = (this._lastTime !== null)
            ? Math.min(elapsed - this._lastTime, 0.1) : 0.016;
        this._lastTime = elapsed;

        // Steering
        if (this.keys.left) this.heading += TURN_SPEED * delta;
        if (this.keys.right) this.heading -= TURN_SPEED * delta;

        // Thrust
        if (this.keys.forward) this.velocity += ACCEL * delta;
        if (this.keys.backward) this.velocity -= ACCEL * 0.4 * delta;
        this.velocity *= DRAG;
        this.velocity = THREE.MathUtils.clamp(this.velocity, -MAX_SPEED, MAX_SPEED * 0.2);
        this.speed = Math.abs(this.velocity);

        // Rotation
        this.ship.rotation.y = this.heading;

        // Forward from model
        this.ship.updateMatrixWorld(true);
        const forward = new THREE.Vector3();
        this.ship.getWorldDirection(forward);
        forward.negate(); // Model might face local -Z

        // Move
        this.ship.position.x += forward.x * this.velocity * delta;
        this.ship.position.z += forward.z * this.velocity * delta;

        // Island collision
        const dx = this.ship.position.x - ISLAND_POS.x;
        const dz = this.ship.position.z - ISLAND_POS.z;
        const distSq = dx * dx + dz * dz;
        if (distSq < ISLAND_RADIUS * ISLAND_RADIUS) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const nz = dz / dist;
            this.ship.position.x = ISLAND_POS.x + nx * ISLAND_RADIUS;
            this.ship.position.z = ISLAND_POS.z + nz * ISLAND_RADIUS;
            this.velocity *= 0.1;
        }

        // Bobbing
        const baseY = this.ship.userData.baseY || 0;
        this.ship.position.y = baseY + Math.sin(elapsed * 1.5) * (0.15 + this.speed * 0.006);

        // Roll / pitch
        const turnRoll = (this.keys.left ? 1 : 0) - (this.keys.right ? 1 : 0);
        this.ship.rotation.z = THREE.MathUtils.lerp(this.ship.rotation.z, turnRoll * 0.05, 0.06);
        this.ship.rotation.x = Math.cos(elapsed * 0.6) * 0.008;

        // Update Camera OrbitControls
        this.controls.target.copy(this.ship.position);
        this.controls.update();
    }

    dispose() {
        window.removeEventListener('keydown', this._boundDown);
        window.removeEventListener('keyup', this._boundUp);
    }
}
