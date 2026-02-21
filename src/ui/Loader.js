/**
 * Loader.js — Loading screen with progress bar
 *
 * Tracks: merry, island, dragon
 */

import { gsap } from 'gsap';

export class Loader {
    constructor() {
        this.loaderEl = document.getElementById('loader');
        this.fillEl = document.getElementById('load-fill');
        this.progress = { merry: 0, island: 0, dragon: 0 };
    }

    update(fraction, name) {
        this.progress[name] = fraction;
        const total =
            (this.progress.merry + this.progress.island + this.progress.dragon) / 3;
        if (this.fillEl) {
            this.fillEl.style.width = `${Math.round(total * 100)}%`;
        }
    }

    complete() {
        if (this.fillEl) this.fillEl.style.width = '100%';
        gsap.to(this.loaderEl, {
            opacity: 0,
            duration: 0.8,
            delay: 0.3,
            onComplete: () => {
                if (this.loaderEl) this.loaderEl.remove();
            },
        });
    }
}
