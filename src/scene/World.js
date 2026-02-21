/**
 * World.js — Atmospheric effects (optimized)
 *
 * Moon, fireflies, birds, lanterns, stars.
 * Night: Pure SCREEN FLASH lightning (Option A) for max performance + light burst.
 */

import * as THREE from 'three';

export class World {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.scene = sceneManager.scene;
        this.isNight = false;
        this._lastTime = null;

        // Lightning flash overlay (DOM element)
        this._flashOverlay = document.getElementById('lightning-flash');

        this._buildMoon();
        this._buildFireflies();
        this._buildBirds();
        this._buildLanterns();
        this._buildStars();
        this._buildLightning();
    }

    /* ── Moon ──────────────────────────────────────────────────────── */
    _buildMoon() {
        const geo = new THREE.SphereGeometry(20, 32, 32);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xffffaa, emissive: 0x444433,
            emissiveIntensity: 0.3, roughness: 0.8,
        });
        this.moon = new THREE.Mesh(geo, mat);
        this.moon.position.set(-100, 120, -200);
        this.moon.visible = false;
        this.scene.add(this.moon);
    }

    /* ── Fireflies (night) ────────────────────────────────────────── */
    _buildFireflies() {
        const count = 60;
        const c = document.createElement('canvas');
        c.width = 32; c.height = 32;
        const ctx = c.getContext('2d');
        const gr = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gr.addColorStop(0, 'rgba(255,200,0,1)');
        gr.addColorStop(1, 'rgba(255,200,0,0)');
        ctx.fillStyle = gr; ctx.fillRect(0, 0, 32, 32);

        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i += 3) {
            pos[i] = (Math.random() - 0.5) * 60;
            pos[i + 1] = 2 + Math.random() * 15;
            pos[i + 2] = (Math.random() - 0.5) * 60;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.fireflies = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0xffaa00, size: 0.8, map: new THREE.CanvasTexture(c),
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
        }));
        this.scene.add(this.fireflies);
    }

    /* ── Birds (day) ──────────────────────────────────────────────── */
    _buildBirds() {
        this.birds = new THREE.Group();
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(
            [0, 0, 0, 0.5, 0, 0.5, -0.5, 0, 0.5], 3
        ));
        for (let i = 0; i < 10; i++) {
            const b = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
            b.position.set((Math.random() - 0.5) * 80, 50 + Math.random() * 20, (Math.random() - 0.5) * 80);
            b.userData.offset = Math.random() * Math.PI * 2;
            this.birds.add(b);
        }
        this.scene.add(this.birds);
    }

    /* ── Lanterns ──────────────────────────────────────────────────── */
    _buildLanterns() {
        this.lanterns = new THREE.Group();
        const geo = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 6);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff4422, emissive: 0xff4400, emissiveIntensity: 1.5 });
        for (let i = 0; i < 15; i++) {
            const l = new THREE.Mesh(geo, mat.clone());
            const a = Math.random() * Math.PI * 2;
            const r = 30 + Math.random() * 50;
            l.position.set(Math.cos(a) * r, 0.3, Math.sin(a) * r);
            if (i % 3 === 0) {
                const pl = new THREE.PointLight(0xffaa00, 0.5, 15);
                pl.position.y = 0.5;
                l.add(pl);
            }
            l.userData = { offset: Math.random() * 100, speed: 0.3 + Math.random() * 0.4 };
            this.lanterns.add(l);
        }
        this.scene.add(this.lanterns);
    }

    /* ── Stars ─────────────────────────────────────────────────────── */
    _buildStars() {
        const count = 1200;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i += 3) {
            const r = 4000 + Math.random() * 4000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i] = r * Math.sin(phi) * Math.cos(theta);
            pos[i + 1] = Math.abs(r * Math.cos(phi));
            pos[i + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.stars = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0xffffff, size: 2, transparent: true, opacity: 0,
        }));
        this.scene.add(this.stars);
    }

    /* ══════════════════════════════════════════════════════════════════
       LIGHTNING (SPRITE DECAL — OPTION B)
       - Uses a 2D sprite plane with a lightning texture
       - Bright point light burst
       - Full screen white flash (CSS overlay animation)
       ══════════════════════════════════════════════════════════════════ */
    _buildLightning() {
        // Scene light for the flash burst
        this.lightningLight = new THREE.PointLight(0xaaccff, 0, 800);
        this.lightningLight.position.set(0, 80, 0);
        this.scene.add(this.lightningLight);

        // Lightning sprite
        const texLoader = new THREE.TextureLoader();
        const lnTex = texLoader.load('/textures/lightning.png');
        const spriteMat = new THREE.SpriteMaterial({
            map: lnTex,
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.lightningSprite = new THREE.Sprite(spriteMat);
        this.scene.add(this.lightningSprite);

        this._lnActive = false;
        this._lnTimer = 0;
        this._lnPhase = 0;
        this._lnCooldown = 4;
        this._lnOrigin = { x: 0, z: 0 };
    }

    _triggerScreenFlash() {
        if (!this._flashOverlay) return;
        this._flashOverlay.classList.remove('flash');
        void this._flashOverlay.offsetWidth;
        this._flashOverlay.classList.add('flash');
    }

    _flashLightning() {
        if (this._lnActive) return;
        this._lnActive = true;
        this._lnPhase = 0;
        this._lnTimer = 0;

        const cam = this.sm.camera.position;
        // Spawn burst FAR from camera (150-250 units away)
        const angle = Math.random() * Math.PI * 2;
        const distance = 150 + Math.random() * 100;
        this._lnOrigin.x = cam.x + Math.cos(angle) * distance;
        this._lnOrigin.z = cam.z + Math.sin(angle) * distance;

        this.lightningLight.position.set(this._lnOrigin.x, 120, this._lnOrigin.z);

        // Randomize sprite size and position slightly 
        this.lightningSprite.position.set(this._lnOrigin.x, 100 + Math.random() * 40, this._lnOrigin.z);
        const scaleXYZ = 150 + Math.random() * 100;
        this.lightningSprite.scale.set(scaleXYZ, scaleXYZ, 1);

        // Randomize rotation so the bolt looks different each time
        this.lightningSprite.material.rotation = (Math.random() - 0.5) * 0.5;

        this._doFlash();
        this._triggerScreenFlash();
    }

    _doFlash() {
        this.lightningLight.intensity = 30 + Math.random() * 20;
        this.lightningSprite.material.opacity = 0.8 + Math.random() * 0.2;
    }

    _updateLightning(dt) {
        // Spawn new strike
        if (this.isNight && !this._lnActive) {
            this._lnCooldown -= dt;
            if (this._lnCooldown <= 0) {
                this._flashLightning();
                this._lnCooldown = 4 + Math.random() * 8;
            }
        }

        if (!this._lnActive) return;

        this._lnTimer += dt;

        // Multi-flicker phases: re-flash at 0.1s and 0.25s for realism
        const phases = [0, 0.1, 0.25];
        if (this._lnPhase < phases.length && this._lnTimer >= phases[this._lnPhase]) {
            this._doFlash();
            this._lnPhase++;
        }

        // Fade out after flickers
        if (this._lnTimer >= 0.4) {
            const fade = Math.min((this._lnTimer - 0.4) / 0.5, 1);
            this.lightningLight.intensity = 50 * (1 - fade);
            this.lightningSprite.material.opacity = 1 - fade;

            if (fade >= 1) {
                this._lnActive = false;
                this.lightningLight.intensity = 0;
                this.lightningSprite.material.opacity = 0;
            }
        }
    }

    /* ── Per-frame ────────────────────────────────────────────────── */
    tick(elapsed) {
        const dt = (this._lastTime !== null)
            ? Math.min(elapsed - this._lastTime, 0.1) : 0.016;
        this._lastTime = elapsed;

        // Fireflies
        if (this.fireflies && this.fireflies.material.opacity > 0.01) {
            const p = this.fireflies.geometry.attributes.position.array;
            for (let i = 1; i < p.length; i += 3) p[i] += Math.sin(elapsed * 2 + i) * 0.02;
            this.fireflies.geometry.attributes.position.needsUpdate = true;
        }

        // Birds
        if (this.birds && this.birds.visible) {
            this.birds.children.forEach(b => {
                b.position.x += Math.sin(elapsed + b.userData.offset) * 0.05;
                b.position.z += 0.02;
                if (b.position.z > 60) b.position.z = -60;
            });
        }

        // Lanterns
        if (this.lanterns) {
            this.lanterns.children.forEach(l => {
                l.position.y = 0.3 + Math.sin(elapsed * l.userData.speed + l.userData.offset) * 0.15;
            });
        }

        this._updateLightning(dt);
    }
}
