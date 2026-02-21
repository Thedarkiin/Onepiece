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
       LIGHTNING (3D LINE + SCENE FLASH — ORIGINAL)
       - Draws a jagged 3D Line material
       - Flashes the actual scene background and fog to pure white
       ══════════════════════════════════════════════════════════════════ */
    _buildLightning() {
        this.lightningBolts = [];
        this._lnCooldown = 4 + Math.random() * 8;
    }

    _triggerLightning() {
        // Flash actual scene background and fog
        const flashColor = new THREE.Color(0xffffff);
        // We use the night fog color from CONFIG
        const nightFog = new THREE.Color(0x05070a);

        this.scene.background = flashColor;
        this.scene.fog.color = flashColor;

        // Temporarily boost the ambient light
        const originalIntensity = this.sm.ambientLight ? this.sm.ambientLight.intensity : 0.1;
        if (this.sm.ambientLight) this.sm.ambientLight.intensity = 2.0;

        setTimeout(() => {
            this.scene.background = nightFog;
            this.scene.fog.color = nightFog;
            if (this.sm.ambientLight) this.sm.ambientLight.intensity = originalIntensity;
        }, 100);

        // Draw 3D Bolt
        // Centered around the island area
        const start = new THREE.Vector3(180 + (Math.random() - 0.5) * 150, 100 + Math.random() * 50, -80 + (Math.random() - 0.5) * 150);
        const end = new THREE.Vector3(start.x + (Math.random() - 0.5) * 40, 0, start.z + (Math.random() - 0.5) * 40);

        const points = [];
        let current = start.clone();
        points.push(current.clone());
        for (let i = 0; i < 15; i++) {
            current.lerp(end, (i + 1) / 15);
            if (i < 14) {
                current.x += (Math.random() - 0.5) * 15;
                current.z += (Math.random() - 0.5) * 15;
            }
            points.push(current.clone());
        }

        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: 0xaaddff, linewidth: 3, transparent: true });
        const bolt = new THREE.Line(geo, mat);

        this.scene.add(bolt);
        this.lightningBolts.push({ mesh: bolt, age: 0 });
    }

    _updateLightning(dt) {
        if (!this.isNight) return;

        // Spawn new strike
        this._lnCooldown -= dt;
        if (this._lnCooldown <= 0) {
            this._triggerLightning();
            this._lnCooldown = 4 + Math.random() * 10;
        }

        // Cleanup Bolts properly to prevent lag
        for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
            const b = this.lightningBolts[i];
            // Since dt is usually ~0.016, age increases similarly to original frame increment
            b.age += dt * 60; // scale up to match original `b.age += 1` per frame

            b.mesh.material.opacity = 1 - (b.age / 10);

            if (b.age > 10) {
                this.scene.remove(b.mesh);
                b.mesh.geometry.dispose();
                b.mesh.material.dispose();
                this.lightningBolts.splice(i, 1);
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
