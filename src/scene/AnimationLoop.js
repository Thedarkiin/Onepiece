/**
 * AnimationLoop.js — requestAnimationFrame manager
 *
 * Drives the render loop, updates Three.js AnimationMixers
 * and any registered ticker objects (World, etc.).
 */

import * as THREE from 'three';

export class AnimationLoop {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.clock = new THREE.Clock();
        this.mixers = [];
        this.tickers = [];
        this._running = false;
        this._raf = null;
    }

    addMixer(mixer) { this.mixers.push(mixer); }
    addTicker(obj) { this.tickers.push(obj); }

    start() {
        if (this._running) return;
        this._running = true;
        this._loop();
    }

    stop() {
        this._running = false;
        if (this._raf) cancelAnimationFrame(this._raf);
    }

    _loop() {
        if (!this._running) return;
        this._raf = requestAnimationFrame(() => this._loop());

        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();

        // Update animation mixers (Luffy idle, etc.)
        for (const mixer of this.mixers) {
            mixer.update(delta);
        }

        // Update tickers (World particles, etc.)
        for (const ticker of this.tickers) {
            if (typeof ticker.tick === 'function') {
                ticker.tick(elapsed);
            }
        }

        // Render via SceneManager (updates water + bloom)
        this.sm.render();
    }
}
